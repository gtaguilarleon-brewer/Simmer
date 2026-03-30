import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CHUNK_SIZE = 80; // Max ingredients per API call to stay within token limits

// Categories the UI knows about (matches CATEGORY_ORDER in categories.js).
// Any category Haiku returns that isn't in this set is blanked out so that
// detectCategory() in the client fills it in via keyword matching instead.
const VALID_CATEGORIES = new Set([
  "Produce",
  "Meat & Seafood",
  "Dairy & Refrigerated",
  "Bread & Bakery",
  "Dry Goods & Pasta",
  "Canned & Jarred",
  "Oils, Sauces & Condiments",
  "Frozen",
  "Beverages",
  "Baby & Kids",
  "Household & Paper",
  "Other",
]);

/**
 * POST /api/normalize-ingredients
 * Layer 2 of the three-layer normalization pipeline.
 * Receives pre-processed ingredient strings from the client and returns
 * structured, normalized items with category hints for the client to use.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const ingredients = body?.ingredients;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return Response.json({ normalized: [] });
    }

    // Sanitize: ensure all fields are strings within safe length bounds
    const sanitized = ingredients
      .filter(ing => ing && typeof ing === "object")
      .map(ing => ({
        name: String(ing.name || "").slice(0, 200),
        source: String(ing.source || "unknown").slice(0, 100),
      }))
      .filter(ing => ing.name.trim().length > 0);

    if (sanitized.length === 0) {
      return Response.json({ normalized: [] });
    }

    // Process in chunks to stay within Haiku's per-call token budget
    const chunks = [];
    for (let i = 0; i < sanitized.length; i += CHUNK_SIZE) {
      chunks.push(sanitized.slice(i, i + CHUNK_SIZE));
    }

    let allNormalized = [];
    for (const chunk of chunks) {
      const result = await processChunk(chunk);
      allNormalized = allNormalized.concat(result);
    }

    return Response.json({ normalized: allNormalized });
  } catch (err) {
    console.error("Normalize ingredients error:", err);
    return Response.json({ error: err.message || "Normalization failed" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// processChunk
// First attempt: full prompt. If JSON parsing fails, one retry with the
// simplified prompt. If the API is unreachable or both parse attempts fail,
// fall through to the regex tokenizer.
// ---------------------------------------------------------------------------
async function processChunk(chunk) {
  const lines = buildIngredientLines(chunk);

  // ── Attempt 1: Full prompt ────────────────────────────────────────────────
  let responseText = null;
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildFullPrompt(lines) }],
    });
    responseText = response?.content?.[0]?.text || "[]";
  } catch (apiErr) {
    console.error("Haiku API call failed for chunk, using fallback:", apiErr.message);
    return fallbackParse(chunk);
  }

  try {
    return validateItems(parseJsonResponse(responseText));
  } catch (parseErr) {
    console.warn("JSON parse failed on first attempt, retrying:", parseErr.message);
  }

  // ── Attempt 2: Simplified prompt (one retry on parse failure) ────────────
  try {
    const retryResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildRetryPrompt(lines) }],
    });
    const retryText = retryResponse?.content?.[0]?.text || "[]";
    try {
      return validateItems(parseJsonResponse(retryText));
    } catch (parseErr2) {
      console.warn("JSON parse failed on retry, using fallback:", parseErr2.message);
    }
  } catch (retryErr) {
    console.error("Haiku retry API call failed:", retryErr.message);
  }

  // ── Final fallback: regex tokenizer ──────────────────────────────────────
  return fallbackParse(chunk);
}

// ---------------------------------------------------------------------------
// parseJsonResponse
// Handles common Haiku formatting quirks:
//   - Markdown code fences (```json ... ```)
//   - Preamble text before the array ("Here is the output: [...]")
// ---------------------------------------------------------------------------
function parseJsonResponse(text) {
  let cleaned = text.trim();

  // Strip markdown code fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?\s*```\s*$/, "")
      .trim();
  }

  // If there's still preamble text, extract just the JSON array.
  // Use /\[\s*[{[]/ rather than a greedy /\[[\s\S]*\]/ so that bracket-
  // containing preamble ("Here are the [5 items]...") doesn't swallow the array.
  if (!cleaned.startsWith("[")) {
    const arrayStart = cleaned.search(/\[\s*[\[{]/);   // finds '[{' or '[['
    const emptyArray = cleaned.search(/\[\s*\]/);       // or '[]'
    const idx = arrayStart !== -1
      ? (emptyArray !== -1 ? Math.min(arrayStart, emptyArray) : arrayStart)
      : emptyArray;
    if (idx !== -1) cleaned = cleaned.slice(idx);
  }

  // Trim any trailing text after the closing bracket (e.g. "Done.\n" after "]")
  const lastBracket = cleaned.lastIndexOf("]");
  if (lastBracket !== -1 && lastBracket < cleaned.length - 1) {
    cleaned = cleaned.slice(0, lastBracket + 1);
  }

  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// validateItems
// Normalizes Haiku's output into a consistent shape. Key changes from the
// old inline version:
//   - Includes the category field (used by detectCategory as primary signal)
//   - Preserves qty: 0 for pantry/to-taste items (old code coerced 0 → 1)
// ---------------------------------------------------------------------------
function validateItems(parsed) {
  return (Array.isArray(parsed) ? parsed : [])
    .map(n => ({
      item: String(n.item || "").toLowerCase().trim(),
      // Preserve qty 0 for pantry items. Old: `parseFloat(qty) || 1` would
      // incorrectly coerce 0 to 1. New: only default to 1 on NaN/missing.
      qty: typeof n.qty === "number"
        ? n.qty
        : (isNaN(parseFloat(n.qty)) ? 1 : parseFloat(n.qty)),
      unit: String(n.unit || "").toLowerCase().trim(),
      qualifier: String(n.qualifier || "").trim(),
      // Blank out unrecognized categories so detectCategory() fills them in
      category: VALID_CATEGORIES.has(String(n.category || "")) ? String(n.category) : "",
      source: String(n.source || ""),
      raw: String(n.raw || ""),
    }))
    .filter(n => n.item.length > 0);
}

// ---------------------------------------------------------------------------
// buildIngredientLines
// Formats chunk items for insertion into the prompt.
// ---------------------------------------------------------------------------
function buildIngredientLines(chunk) {
  return chunk
    .map((ing, i) => `${i + 1}. "${ing.name}" (from: ${ing.source})`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// buildFullPrompt
// Comprehensive prompt with unit table, prep descriptor list, 10 few-shot
// examples covering the hardest real-world cases.
// ---------------------------------------------------------------------------
function buildFullPrompt(ingredientLines) {
  return `You are an ingredient normalization assistant for a grocery shopping app. Parse each raw ingredient string into structured data for a clean, organized grocery list.

RAW INGREDIENTS:
${ingredientLines}

────────────────────────────────────────────────────────────────────────────────
UNIT STANDARDIZATION — use these exact strings in the "unit" field:

  tablespoon / tablespoons / tbsp / Tbsp / T / tablesoon / tablesoons  →  "tbsp"
  teaspoon / teaspoons / tsp                                            →  "tsp"
  cup / cups / c                                                        →  "cups"
  ounce / ounces / oz                                                   →  "oz"
  pound / pounds / lb / lbs                                             →  "lbs"
  clove / cloves                                                        →  "cloves"
  bunch / bunches                                                       →  "bunch"
  can / cans                                                            →  "can"
  package / packages / pkg / packet / packets                           →  "pkg"
  head / heads                                                          →  "heads"
  piece / pieces / pc, or any countable whole item (onion, egg, lime)  →  "each"
  "a handful" of herbs or leafy greens                                  →  "bunch"
  No clear unit (vague amounts, pantry staples, to-taste items)         →  ""

────────────────────────────────────────────────────────────────────────────────
PREP DESCRIPTORS — these belong in "qualifier", NEVER in "item":

  chopped, finely chopped, roughly chopped, coarsely chopped
  diced, finely diced, small diced
  minced, finely minced
  sliced, thinly sliced, thickly sliced, julienned
  crushed, grated, freshly grated, shredded, crumbled
  cubed, halved, quartered, torn, pressed
  peeled, trimmed, deveined, seeded, pitted, zested, juiced
  warmed, softened, melted, thawed, rinsed, drained
  dried, fresh, frozen, canned, whole, ground, freshly ground, toasted, roasted
  lightly beaten, at room temperature

────────────────────────────────────────────────────────────────────────────────
RULES:

1. "item" = the store-shelf name ONLY. No quantities, no units, no prep descriptors.
   Examples:
     "bone-in skin-on chicken thighs"  →  item: "chicken thighs"
     "finely chopped fresh cilantro"   →  item: "cilantro",   qualifier: "finely chopped, fresh"
     "extra virgin olive oil"          →  item: "olive oil",  qualifier: "extra virgin"
     "freshly ground black pepper"     →  item: "black pepper", qualifier: "freshly ground"
     "kosher salt"                     →  item: "salt",       qualifier: "kosher"

2. Correct obvious typos before parsing:
     "tablesoons" → "tablespoons",  "chiken" → "chicken",  "parsely" → "parsley"
     "tomatoe" → "tomato",  "letuce" → "lettuce",  "mozzarela" → "mozzarella"

3. Ranges ("2-3 cloves") → use the higher number: qty: 3.

4. Word quantities:
     "one" → 1,  "two" → 2,  "a dozen" / "dozen" → 12,  "half" → 0.5,  "quarter" → 0.25

5. Quantity defaults:
     No quantity stated → qty: 1
     Vague/pantry amounts ("to taste", "pinch", "dash", "drizzle", "splash", "as needed",
     "if desired", "oil for cooking", "for greasing") → qty: 0, unit: ""
     Exception — "a handful of herbs or greens" → qty: 1, unit: "bunch"

6. Split combined items joined by "and":
     "salt and pepper to taste"  →  two entries, both qty: 0
     "oil and vinegar"           →  two entries
     Do NOT split compound names: "mac and cheese", "salt and vinegar chips" → one entry

7. Parentheticals:
     "(or X)" / "(substitute: X)"     →  use primary item only, ignore alternate
     "(about N cups)"                  →  use N as qty hint
     "(14 oz) can" or "(14-oz) can"   →  unit: "can", qualifier: "14 oz"
     "one 28-ounce can X"             →  item: X, qty: 1, unit: "can", qualifier: "28 oz"

8. Fractions are already decimal: "1.5 cups" not "1½ cups" (pre-processing handled it).

9. "source" field: copy exactly from the "(from: X)" label in the input.
   "raw" field: copy the ingredient text inside the quotes exactly as it appears.

────────────────────────────────────────────────────────────────────────────────
CATEGORIES — assign exactly one per item:

  "Produce"                    fresh fruits, vegetables, herbs
  "Meat & Seafood"             raw meat, poultry, fish, shellfish
  "Dairy & Refrigerated"       milk, cheese, eggs, yogurt, butter, cream
  "Bread & Bakery"             bread, rolls, tortillas, baked goods
  "Dry Goods & Pasta"          pasta, rice, grains, legumes, flour, nuts, dried goods
  "Canned & Jarred"            canned/jarred vegetables, beans, tomatoes, broth, sauces
  "Oils, Sauces & Condiments"  oils, vinegars, soy sauce, hot sauce, dressings, honey, tahini,
                               spices (salt, pepper, cumin, paprika, cinnamon, etc.), dried herbs,
                               baking powder, baking soda, vanilla extract
  "Frozen"                     frozen vegetables, proteins, ice cream
  "Beverages"                  water, juice, wine, beer, coffee, tea
  "Baby & Kids"                baby food, formula, diapers
  "Household & Paper"          paper towels, cleaning supplies, storage bags
  "Other"                      specialty or international items that don't fit any category above

────────────────────────────────────────────────────────────────────────────────
OUTPUT FORMAT:

Return ONLY a valid JSON array. No markdown fences, no explanation, no text outside the array.
Each object must have exactly these 7 fields in this order:
{"item": string, "qty": number, "unit": string, "qualifier": string, "category": string, "source": string, "raw": string}

────────────────────────────────────────────────────────────────────────────────
EXAMPLES:

Input:  1. "1.5 cups Greek yogurt (or sour cream)" (from: Tikka Masala)
Output: [{"item":"greek yogurt","qty":1.5,"unit":"cups","qualifier":"","category":"Dairy & Refrigerated","source":"Tikka Masala","raw":"1.5 cups Greek yogurt (or sour cream)"}]

Input:  1. "salt and pepper to taste" (from: Roasted Chicken)
Output: [{"item":"salt","qty":0,"unit":"","qualifier":"","category":"Other","source":"Roasted Chicken","raw":"salt and pepper to taste"},{"item":"pepper","qty":0,"unit":"","qualifier":"","category":"Other","source":"Roasted Chicken","raw":"salt and pepper to taste"}]

Input:  1. "2-3 cloves garlic, minced" (from: Pasta)
Output: [{"item":"garlic","qty":3,"unit":"cloves","qualifier":"minced","category":"Produce","source":"Pasta","raw":"2-3 cloves garlic, minced"}]

Input:  1. "1 (14 oz) can coconut milk" (from: Thai Curry)
Output: [{"item":"coconut milk","qty":1,"unit":"can","qualifier":"","category":"Canned & Jarred","source":"Thai Curry","raw":"1 (14 oz) can coconut milk"}]

Input:  1. "tablesoons lime juice" (from: Fish Tacos)
Output: [{"item":"lime juice","qty":1,"unit":"tbsp","qualifier":"","category":"Produce","source":"Fish Tacos","raw":"tablesoons lime juice"}]

Input:  1. "2 lbs chicken thighs, bone-in" (from: Sheet Pan Dinner)
Output: [{"item":"chicken thighs","qty":2,"unit":"lbs","qualifier":"bone-in","category":"Meat & Seafood","source":"Sheet Pan Dinner","raw":"2 lbs chicken thighs, bone-in"}]

Input:  1. "a handful of fresh basil leaves" (from: Caprese Salad)
Output: [{"item":"basil","qty":1,"unit":"bunch","qualifier":"fresh","category":"Produce","source":"Caprese Salad","raw":"a handful of fresh basil leaves"}]

Input:  1. "extra virgin olive oil" (from: Roasted Vegetables)
Output: [{"item":"olive oil","qty":0,"unit":"","qualifier":"extra virgin","category":"Oils, Sauces & Condiments","source":"Roasted Vegetables","raw":"extra virgin olive oil"}]

Input:  1. "0.5 red bell pepper, seeds removed" (from: Stir Fry)
Output: [{"item":"red bell pepper","qty":0.5,"unit":"each","qualifier":"seeds removed","category":"Produce","source":"Stir Fry","raw":"0.5 red bell pepper, seeds removed"}]

Input:  1. "one 28-ounce can crushed tomatoes" (from: Marinara)
Output: [{"item":"crushed tomatoes","qty":1,"unit":"can","qualifier":"28 oz","category":"Canned & Jarred","source":"Marinara","raw":"one 28-ounce can crushed tomatoes"}]

────────────────────────────────────────────────────────────────────────────────
Now parse ALL the RAW INGREDIENTS listed at the top. Return the JSON array only.`;
}

// ---------------------------------------------------------------------------
// buildRetryPrompt
// Shorter, more direct prompt used when the full prompt produced invalid JSON.
// Trades some accuracy for reliability — just needs to produce parseable output.
// ---------------------------------------------------------------------------
function buildRetryPrompt(ingredientLines) {
  return `Parse these raw ingredient strings into a JSON array. Return ONLY valid JSON — no markdown, no explanation, nothing outside the array.

Each object must have exactly these 7 fields:
{"item": string, "qty": number, "unit": string, "qualifier": string, "category": string, "source": string, "raw": string}

Field rules:
- item: lowercase store-shelf name only (strip all quantities, units, prep words like "chopped" or "diced")
- qty: numeric quantity. Use 0 for "to taste" / "pinch" / "as needed". Use 1 if unspecified.
- unit: use exactly one of: tbsp, tsp, cups, oz, lbs, cloves, bunch, can, pkg, heads, each, or ""
- qualifier: prep notes (bone-in, diced, minced, fresh, etc.)
- category: use exactly one of these values (copy the string exactly, including punctuation):
  "Produce" | "Meat & Seafood" | "Dairy & Refrigerated" | "Bread & Bakery" |
  "Dry Goods & Pasta" | "Canned & Jarred" | "Oils, Sauces & Condiments" |
  "Frozen" | "Beverages" | "Baby & Kids" | "Household & Paper" | "Other"
- source: copy from "(from: X)" label in input
- raw: copy the ingredient text inside the quotes exactly

INGREDIENTS:
${ingredientLines}`;
}

// ---------------------------------------------------------------------------
// Improved fallback parser — runs when Haiku is unavailable.
// Uses a proper tokenizer: qty → unit → item → qualifier.
// Produces "good enough" results to keep the grocery list usable.
// ---------------------------------------------------------------------------

// Fraction char → decimal string (mirrors ingredientPreprocess Layer 1)
const FB_UNICODE_FRACTIONS = {
  '\u00BD': '0.5',   // ½
  '\u2153': '0.333', // ⅓
  '\u00BC': '0.25',  // ¼
  '\u00BE': '0.75',  // ¾
  '\u2154': '0.667', // ⅔
  '\u215B': '0.125', // ⅛
};

// Canonical unit map — keyed on every variant we're likely to see, including
// common OCR/scraping typos. Values are the standardized abbreviations.
const FB_UNIT_MAP = {
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp', tbs: 'tbsp',
  tablesoon: 'tbsp', tablesoons: 'tbsp', // typo variants
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp',
  cup: 'cups', cups: 'cups',
  ounce: 'oz', ounces: 'oz', oz: 'oz',
  pound: 'lbs', pounds: 'lbs', lb: 'lbs', lbs: 'lbs',
  clove: 'cloves', cloves: 'cloves',
  bunch: 'bunch', bunches: 'bunch', handful: 'bunch', handfuls: 'bunch',
  can: 'can', cans: 'can',
  package: 'pkg', packages: 'pkg', pkg: 'pkg', packet: 'pkg', packets: 'pkg',
  head: 'heads', heads: 'heads',
  piece: 'each', pieces: 'each', pc: 'each',
  stalk: 'stalks', stalks: 'stalks',
  sprig: 'sprigs', sprigs: 'sprigs',
  slice: 'slices', slices: 'slices',
  strip: 'strips', strips: 'strips',
  jar: 'jar', jars: 'jar',
  bottle: 'bottle', bottles: 'bottle',
  bag: 'bag', bags: 'bag',
  quart: 'qt', quarts: 'qt', qt: 'qt',
  pint: 'pint', pints: 'pint',
  gallon: 'gal', gallons: 'gal',
  gram: 'g', grams: 'g',
  kilogram: 'kg', kilograms: 'kg', kg: 'kg',
  liter: 'l', liters: 'l',
  milliliter: 'ml', milliliters: 'ml', ml: 'ml',
};

// Unit names sorted longest-first so the regex matches greedily
// (e.g. "tablespoons" before "tablespoon" before "tbs")
const FB_UNIT_NAMES_SORTED = Object.keys(FB_UNIT_MAP).sort((a, b) => b.length - a.length);

// Regex to match a unit at the start of the remaining string, optionally
// followed by "of" (e.g. "2 tablespoons of lime juice")
const FB_UNIT_RE = new RegExp(
  `^(${FB_UNIT_NAMES_SORTED.map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})s?\\b\\s*(?:of\\s+)?`,
  'i'
);

// Word numbers (handles "a clove", "one onion", "half a cup", etc.)
const FB_WORD_NUMBERS = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, dozen: 12, half: 0.5, quarter: 0.25,
};

// Prep descriptor words/phrases that should move from item name to qualifier.
// Sorted longest-first so multi-word phrases match before single words.
const FB_PREP_WORDS = [
  'finely chopped', 'roughly chopped', 'coarsely chopped',
  'finely diced', 'thinly sliced', 'thickly sliced', 'finely minced',
  'freshly ground', 'freshly grated', 'lightly beaten',
  'at room temperature',
  'chopped', 'diced', 'minced', 'sliced', 'crushed', 'grated', 'shredded',
  'julienned', 'cubed', 'halved', 'quartered', 'peeled', 'deveined', 'trimmed',
  'warmed', 'softened', 'melted', 'thawed', 'rinsed', 'drained',
  'dried', 'fresh', 'frozen', 'canned', 'whole', 'crumbled',
  'torn', 'pressed', 'seeded', 'pitted', 'zested', 'juiced',
  'ground', 'toasted', 'roasted',
  'finely', 'roughly', 'thinly', 'coarsely', 'lightly', 'well',
];

// Vague-quantity markers → set qty to 0 (treated as pantry/to-taste items)
const FB_VAGUE_QTY_RE = /\bto\s+taste\b|\bas\s+needed\b|\bif\s+desired\b|\boptional\b|\ba\s+pinch\b|\bpinch\b|\ba\s+dash\b|\bdash\b|\ba\s+drizzle\b|\bdrizzle\b|\ba\s+splash\b|\bsplash\b/i;

/**
 * Repair Unicode and ASCII fractions within a string.
 * Kept self-contained here so the fallback works even if ingredientPreprocess
 * isn't imported.
 */
function fbRepairFractions(str) {
  let result = str;

  for (const [char, decimal] of Object.entries(FB_UNICODE_FRACTIONS)) {
    const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Mixed: "1½" → "1.5"
    result = result.replace(new RegExp(`(\\d+)\\s*${escaped}`, 'g'), (_, whole) =>
      String(parseFloat(whole) + parseFloat(decimal))
    );
    // Standalone
    result = result.replace(new RegExp(escaped, 'g'), decimal);
  }

  // ASCII mixed: "1 1/2" → "1.5"
  result = result.replace(/(\d+)\s+(\d+)\/(\d+)/g, (m, w, n, d) => {
    const den = parseInt(d, 10);
    return den > 0 ? String(parseFloat(w) + parseInt(n, 10) / den) : m;
  });

  // Standalone ASCII: "3/4" → "0.75" (denominators 2–16 only)
  result = result.replace(/\b(\d+)\/(\d+)\b/g, (m, n, d) => {
    const den = parseInt(d, 10);
    if (den < 2 || den > 16) return m;
    return String(Math.round(parseInt(n, 10) / den * 10000) / 10000);
  });

  // Mangled leading fractions: "/2 cup" → "0.5 cup"
  result = result.replace(/^\/2(\s|$)/, '0.5$1');
  result = result.replace(/^\/4(\s|$)/, '0.25$1');
  result = result.replace(/^\/3(\s|$)/, '0.333$1');
  result = result.replace(/^\/8(\s|$)/, '0.125$1');

  return result;
}

function fallbackParse(ingredients) {
  return ingredients.map(ing => {
    const raw = ing.name || "";

    // ── 0. Normalize the string ─────────────────────────────────────────
    let text = fbRepairFractions(raw.trim());

    // Strip parenthetical can-size annotations: "1 (14 oz) can" → "1 can"
    text = text.replace(/\(\s*[\d.]+\s*(?:-\s*[\d.]+\s*)?(?:oz|ounce|ounces|lb|lbs|g|kg)\s*\)\s*/gi, '');

    // ── 1. Extract quantity ──────────────────────────────────────────────
    let qty = 1;
    let rest = text.trim();

    // Word numbers first: "a", "one", "two", "dozen", "half", etc.
    const wordNumMatch = rest.match(/^(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|half|quarter)\s+/i);
    if (wordNumMatch) {
      qty = FB_WORD_NUMBERS[wordNumMatch[1].toLowerCase()] ?? 1;
      rest = rest.slice(wordNumMatch[0].length).trim();
    } else {
      // Numeric: handles integers, decimals, and ranges (take higher end)
      const numMatch = rest.match(/^([\d.]+(?:\s*-\s*[\d.]+)?)\s*/);
      if (numMatch) {
        const numStr = numMatch[1].replace(/\s/g, '');
        if (numStr.includes('-')) {
          const parts = numStr.split('-');
          qty = parseFloat(parts[parts.length - 1]) || 1;
        } else {
          qty = parseFloat(numStr) || 1;
        }
        rest = rest.slice(numMatch[0].length).trim();
      }
    }

    // ── 2. Vague-quantity check (to taste, pinch, etc.) ─────────────────
    // Check raw string so we catch "salt, to taste" even after qty extraction
    if (FB_VAGUE_QTY_RE.test(raw)) {
      qty = 0;
    }

    // ── 3. Skip size adjectives before the unit ──────────────────────────
    // e.g. "1 large onion" — "large" sits between qty and item, not a unit
    // We don't strip it yet; it ends up in the item name and Layer 3 cleans it.

    // ── 4. Extract unit ──────────────────────────────────────────────────
    let unit = '';
    const unitMatch = rest.match(FB_UNIT_RE);
    if (unitMatch) {
      const rawUnit = unitMatch[1].toLowerCase();
      unit = FB_UNIT_MAP[rawUnit] || rawUnit;
      rest = rest.slice(unitMatch[0].length).trim();
    }

    // ── 5. Split item from qualifier on the first comma ──────────────────
    const commaParts = rest.split(/,\s*/);
    let itemStr = (commaParts[0] || '').trim();
    const afterComma = commaParts.slice(1).join(', ').trim();

    // ── 6. Strip prep descriptors from front and back of item name ───────
    const qualifierParts = [];

    // Strip leading prep words (e.g. "freshly grated parmesan")
    for (const prep of FB_PREP_WORDS) {
      const leadRe = new RegExp(`^${prep.replace(/\s+/g, '\\s+')}\\s+`, 'i');
      if (leadRe.test(itemStr)) {
        qualifierParts.push(prep);
        itemStr = itemStr.replace(leadRe, '').trim();
        break;
      }
    }

    // Strip trailing prep words (e.g. "cilantro finely chopped")
    for (const prep of FB_PREP_WORDS) {
      const trailRe = new RegExp(`\\s+${prep.replace(/\s+/g, '\\s+')}$`, 'i');
      if (trailRe.test(itemStr)) {
        qualifierParts.push(prep);
        itemStr = itemStr.replace(trailRe, '').trim();
        break;
      }
    }

    if (afterComma) qualifierParts.push(afterComma);
    const qualifier = qualifierParts.join(', ');

    // ── 7. Clean up the item name ────────────────────────────────────────
    let item = itemStr
      .toLowerCase()
      // Remove leading articles
      .replace(/^(a|an|the)\s+/i, '')
      // Remove parenthetical alternates: "(or X)", "(about 2 cups)"
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      // Remove "to taste" / "as needed" suffix if it crept through
      .replace(/,?\s*to\s+taste\s*$/i, '')
      .replace(/,?\s*as\s+needed\s*$/i, '')
      // Remove trailing punctuation
      .replace(/[.,;:]+$/, '')
      .trim();

    // If no unit was found and item starts with a unit word, extract it now.
    // e.g. "tablespoons lime juice" (qty already extracted as 3 upstream)
    if (!unit) {
      const embeddedUnit = item.match(FB_UNIT_RE);
      if (embeddedUnit) {
        unit = FB_UNIT_MAP[embeddedUnit[1].toLowerCase()] || embeddedUnit[1].toLowerCase();
        item = item.slice(embeddedUnit[0].length).trim();
      }
    }

    return {
      item,
      qty,
      unit,
      qualifier,
      category: '',
      source: ing.source,
      raw,
    };
  }).filter(n => n.item.length > 0);
}
