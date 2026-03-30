# Ingredient Normalization: End-to-End Game Plan
_Last updated: 2026-03-30_

---

## The problem

Recipe ingredients come from three sources with wildly different formatting: web scraping, cookbook photo OCR, and manual entry. The current Haiku-based normalization is producing poor results across several dimensions.

**What's broken right now:**
- Unicode fractions corrupted: "1½" becomes "/2", "¼" becomes "/4 teaspoon"
- Units stuck in item names: "tablespoons finely chopped cilantro" instead of qty: 2, unit: tbsp, item: cilantro
- Prep descriptors not stripped: "finely chopped", "diced", "seeds separated", "ripe but firm" all remain in the item name
- Parenthetical alternates not handled: "quartered (OR 2 Roma tomatoes seeded, chopped)" passes through intact
- Duplicate items not merged: "lime juice" appears multiple times across recipes
- Typos in source text: "tablesoons" instead of "tablespoons" confuses both the AI and the fallback parser
- Dedup key is too literal: "chicken thighs" and "chicken thigh" are separate entries

**Root cause:** (1) the Haiku prompt isn't specific enough about what "canonical item name" means, (2) raw ingredient text often has encoding issues before it reaches the API, and (3) client-side dedup logic doesn't do enough post-processing.

---

## Architecture: three-layer defense

Rather than relying entirely on Haiku to solve every problem, this plan introduces three layers that each handle a specific class of issue. Every layer is independently testable.

### Layer 1: Pre-processing (`src/lib/ingredientPreprocess.js`)
_Client-side, runs before the fetch to `/api/normalize-ingredients`_

**What it handles:**

1. **Unicode fraction repair** - Replace corrupted sequences. Build a map:
   - `½` or `\u00BD` → 0.5
   - `⅓` or `\u2153` → 0.333
   - `¼` or `\u00BC` → 0.25
   - `¾` or `\u00BE` → 0.75
   - `⅔` or `\u2154` → 0.667
   - `⅛` or `\u215B` → 0.125
   - Mixed numbers: "1½" → "1.5", "2¼" → "2.25"
   - Catch mangled patterns like "/2" at the start of a string (leftover from a corrupted "½")

2. **Whitespace normalization** - Collapse multiple spaces, trim, remove zero-width chars, normalize dashes (em dash, en dash → hyphen).

3. **Encoding cleanup** - Strip or replace common HTML entities that survive scraping (`&amp;`, `&#8211;`, etc.).

4. **Empty/junk filtering** - Drop entries that are clearly not ingredients (section headers like "For the sauce:", divider lines like "---", entries shorter than 2 characters).

**Implementation:** `preprocessIngredients(rawList)` in `src/lib/ingredientPreprocess.js`. Pure function, no async, easily unit testable. Takes array of `{name, source}`, returns cleaned array of `{name, source}`.

---

### Layer 2: AI normalization (`src/app/api/normalize-ingredients/route.js`)
_Haiku API, improved prompt_

**Key prompt changes:**

1. **Redefine "item" more aggressively** - The canonical item name should be the thing you'd look for on a store shelf. Not "finely chopped cilantro" but "cilantro". Not "bone-in skin-on chicken thighs" but "chicken thighs". Everything else is a qualifier.

2. **Explicit prep descriptor stripping** - Add a rule list of common descriptors that must go into the qualifier field, not the item field. Include: chopped, diced, minced, sliced, crushed, grated, shredded, julienned, cubed, halved, quartered, peeled, deveined, trimmed, warmed, softened, melted, thawed, rinsed, drained, dried, fresh, frozen, canned, whole, ground, crumbled, torn, pressed, seeded, pitted, zested, juiced.

3. **Unit standardization table** - Provide an explicit mapping in the prompt so Haiku doesn't have to guess:
   - tablespoon/tablespoons/tbsp/Tbsp/T → "tbsp"
   - teaspoon/teaspoons/tsp/t → "tsp"
   - cup/cups/c → "cups"
   - ounce/ounces/oz → "oz"
   - pound/pounds/lb/lbs → "lbs"
   - clove/cloves → "cloves"
   - bunch/bunches → "bunch"
   - can/cans → "can"
   - package/pkg/packet → "pkg"
   - head/heads → "heads"
   - piece/pieces/pc → "each"
   - whole items with no unit → "each"

4. **Typo tolerance instruction** - Explicitly tell Haiku to correct obvious typos in ingredient text before parsing. "tablesoons" → "tablespoons", "chiken" → "chicken", etc.

5. **Parenthetical handling rule** - "(or X)" and "(substitute: X)" → use the primary item only. "(about 2 cups)" → use as quantity hint.

6. **Combined item splitting** - "salt and pepper to taste" → two items. "oil and vinegar" → two items. But "mac and cheese" → one item.

7. **Better few-shot examples** - 8-10 diverse examples covering the hardest cases: Unicode fractions, typos, combined items, parenthetical alternates, vague quantities, prep descriptors, no-quantity items, range quantities.

8. **Category hint** - Add a `category` field to the extraction output. Haiku is better at categorizing "tahini" (condiment) or "panko breadcrumbs" (dry goods) than a keyword list. This reduces "Other" bucket items.

**Chunk size:** Keep at 80 ingredients per chunk. Consider reducing to 40 if accuracy drops.

**Per-chunk retry:** One retry with a simplified prompt if the first attempt fails JSON parsing.

---

### Layer 3: Post-processing (`src/lib/ingredientPostprocess.js`)
_Client-side, runs after API response_

**What it handles:**

1. **Aggressive item name cleaning** - Strip any remaining prep words using a regex built from the descriptor list. Remove leading articles ("a ", "an ", "the "). Trim trailing commas, periods, dashes. Collapse to lowercase for matching.

2. **Unit extraction from item name** - If the item name still contains a unit word (e.g., "tablespoons lime juice"), extract it. Move to unit field and update qty if missing.

3. **Singularization for dedup keys** - "chicken thighs" and "chicken thigh" should merge. Use suffix-stripping: if a key ends in "s" and the non-"s" version exists in the map, merge them. Handle "ies" → "y" and "es" → "" cases.

4. **Smart dedup with unit conversion** - Extend to handle compatible unit conversions:
   - oz ↔ lbs (16 oz = 1 lb)
   - tsp ↔ tbsp (3 tsp = 1 tbsp)
   - tbsp ↔ cups (16 tbsp = 1 cup)
   - When units can't be converted, keep separate source entries but display together.

5. **Quantity sanity checking** - Flag likely errors: qty > 20 for most items (probably a parsing error), qty = 0 for items that aren't pantry staples, unit mismatch with item type.

6. **Enhanced pantry filtering** - The current regex approach misses semantic matches:
   - "Extra virgin olive oil" should match pantry staple "olive oil"
   - "Kosher salt" should match "salt"
   - "Freshly ground black pepper" should match "pepper"
   - Approach: for multi-word pantry staples, check if all words appear in the ingredient. For single-word staples, use word-boundary matching.

**Implementation:** `postprocessNormalized(items, pantryStaples)` in `src/lib/ingredientPostprocess.js`. Pure function, no async, easily unit testable.

---

## Improved fallback parser

The regex fallback runs when Haiku is unavailable. Upgrade it to be a reasonable standalone parser.

**Improvements:**
1. Build a proper tokenizer: split into (qty, unit, item, qualifier) using a state machine approach.
2. Handle all Unicode fraction mappings from Layer 1.
3. Use the same unit standardization table from the prompt.
4. Strip prep descriptors using the same list from Layer 3.
5. Handle "X of Y" patterns: "2 tablespoons of olive oil" → qty: 2, unit: tbsp, item: olive oil.
6. Handle comma-separated qualifiers: "1 onion, finely diced" → item: onion, qualifier: finely diced.

The fallback should produce "good enough" results, not perfect ones. Its job is to prevent the grocery list from being unusable when the API is down.

---

## File plan

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/ingredientPreprocess.js` | NEW | Layer 1: encoding fixes, fraction repair, junk filtering |
| `src/lib/ingredientPostprocess.js` | NEW | Layer 3: name cleaning, unit extraction, singularization, smart dedup, pantry filtering |
| `src/app/api/normalize-ingredients/route.js` | REWRITE | Layer 2: improved prompt, better chunk handling, upgraded fallback parser |
| `src/app/page.js` (StepGroceryList) | MODIFY | Wire up pre/post processing, simplify inline dedup logic |
| `src/lib/categories.js` | MODIFY | Expand keyword lists, add Haiku-provided category as primary signal |

---

## Build order

### Phase 1: Pre-processing + fallback (no API dependency)
Build `ingredientPreprocess.js` and the improved fallback parser. This gives us a working grocery list even without Haiku.

**Deliverables:**
- `ingredientPreprocess.js` with full fraction repair, encoding cleanup, junk filtering
- Upgraded `fallbackParse()` in the API route with proper tokenizer
- Manual test with 10-15 real recipes from the library

### Phase 2: Prompt rewrite + response handling
Rewrite the Haiku prompt with all the changes listed above. Update the API route to handle the improved response format. Add chunk error recovery.

**Deliverables:**
- New prompt with unit table, descriptor rules, few-shot examples, typo tolerance
- Category field in normalization output
- Per-chunk retry (one retry with a simplified prompt if the first attempt fails)

### Phase 3: Post-processing + smart dedup
Build `ingredientPostprocess.js`. Wire everything together in StepGroceryList. Replace the inline dedup logic with the new module.

**Deliverables:**
- `ingredientPostprocess.js` with all Layer 3 logic
- Updated StepGroceryList using the three-layer pipeline
- Enhanced pantry filtering with semantic matching
- Singularization-based dedup keys

### Phase 4: End-to-end testing + tuning
Run the full pipeline against every recipe in the database. Compare output to what a human would write on a grocery list. Tune thresholds, add missing keywords to categories, expand the descriptor list.

**Deliverables:**
- Test script that runs all recipes through the pipeline and outputs the grocery list
- Side-by-side comparison: current output vs new output
- Tuned thresholds for pantry staple quantity filtering

---

## Test cases

These represent the hardest real-world inputs. The pipeline should handle all of them correctly.

| Input | Expected output |
|-------|----------------|
| `1½ cups Greek yogurt (or sour cream)` | item: greek yogurt, qty: 1.5, unit: cups |
| `salt and pepper to taste` | Two items, both qty: 0, both flagged as pantry |
| `2-3 cloves garlic, minced` | item: garlic, qty: 3, unit: cloves, qualifier: minced |
| `1 (14 oz) can coconut milk` | item: coconut milk, qty: 1, unit: can |
| `tablesoons lime juice` | item: lime juice, qty: 1, unit: tbsp (typo corrected) |
| `2 lbs chicken thighs, bone-in` | item: chicken thighs, qty: 2, unit: lbs, qualifier: bone-in |
| `1 onion, finely diced` | item: onion, qty: 1, unit: each, qualifier: finely diced |
| `Extra virgin olive oil` | item: olive oil, qty: 0, unit: "" (pantry filtered) |
| `½ red bell pepper, seeds removed` | item: red bell pepper, qty: 0.5, unit: each, qualifier: seeds removed |
| `For the marinade:` | Filtered out (section header) |
| `a handful of fresh basil leaves` | item: basil, qty: 1, unit: bunch, qualifier: fresh |
| `one 28-ounce can crushed tomatoes` | item: crushed tomatoes, qty: 1, unit: can, qualifier: 28 oz |
| `freshly ground black pepper` | Pantry filtered |
| `3 tablespoons finely chopped cilantro` | item: cilantro, qty: 3, unit: tbsp, qualifier: finely chopped |

---

## What success looks like

After this overhaul, the grocery list should:
1. Show clean item names that match what you'd look for on a shelf (no prep words, no units, no quantities in the name)
2. Correctly aggregate quantities across recipes (2 tbsp lime juice from Recipe A + 1 tbsp from Recipe B = 3 tbsp lime juice)
3. Handle Unicode fractions without corruption
4. Merge singular/plural variants of the same ingredient
5. Filter pantry staples reliably, including common variants
6. Categorize items into the right store section 90%+ of the time
7. Degrade gracefully when Haiku is unavailable (fallback parser produces a usable, if less polished, list)

---

## Estimated effort

- Phase 1: ~45 min (pre-processing is mostly string manipulation)
- Phase 2: ~30 min (prompt is the bulk, response handling is straightforward)
- Phase 3: ~45 min (post-processing has the most logic, plus wiring it all together)
- Phase 4: ~30 min (testing and tuning)

**Total: ~2.5 hours** for a solid implementation. Could stretch to 3 if we hit unexpected edge cases in the prompt tuning.
