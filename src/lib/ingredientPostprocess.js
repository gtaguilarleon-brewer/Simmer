/**
 * Layer 3: Post-processing pipeline for normalized ingredient items.
 *
 * Runs client-side after the /api/normalize-ingredients response.
 * Handles: item name cleaning, embedded unit extraction, singularization,
 * smart dedup with unit conversion, enhanced pantry filtering, and
 * category assignment using Haiku's category signal.
 *
 * Usage:
 *   import { postprocessNormalized } from '../lib/ingredientPostprocess';
 *   const dedupedItems = postprocessNormalized(normalizedItems, pantryStaples);
 *   // returns [{item, qty, unit, qualifier, category, sources, displayQty}]
 */

import { detectCategory } from './categories';

// ---------------------------------------------------------------------------
// COOKING PREP DESCRIPTORS — removed from item name, not from qualifier.
// These are preparation methods that don't change what the item IS.
// Sorted longest-first so multi-word phrases match before single words.
// ---------------------------------------------------------------------------
const PREP_DESCRIPTORS = [
  'finely chopped', 'roughly chopped', 'coarsely chopped', 'thinly sliced',
  'thickly sliced', 'roughly torn', 'finely grated', 'coarsely grated',
  'finely diced', 'roughly diced', 'finely minced', 'lightly beaten',
  'freshly squeezed', 'freshly grated', 'freshly ground',
  'patted dry', 'room temperature', 'at room temperature',
  'seeds removed', 'seeds separated', 'pit removed', 'stems removed',
  'rinsed and drained', 'drained and rinsed',
  // Note: 'diced' and 'crushed' intentionally omitted here — they appear as
  // product types in common canned goods ("diced tomatoes", "crushed tomatoes").
  // Haiku returns these as item names; stripping them would lose product identity.
  // Multi-word variants ('finely diced', 'roughly diced') above still catch the
  // prep-descriptor case.
  'chopped', 'minced', 'sliced', 'grated',
  'shredded', 'julienned', 'cubed', 'halved', 'quartered',
  'peeled', 'deveined', 'trimmed', 'warmed', 'softened',
  'melted', 'thawed', 'rinsed', 'drained', 'pressed',
  'seeded', 'pitted', 'zested', 'juiced', 'crumbled', 'torn',
  'beaten', 'whisked', 'sifted', 'packed', 'heaped', 'leveled',
];

// Build regex: word-boundary anchored, global, case-insensitive.
// Sorted longest-first (already is above) to prevent partial matches.
const PREP_DESCRIPTOR_RE = new RegExp(
  '\\b(' + PREP_DESCRIPTORS.map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
  'gi'
);

// ---------------------------------------------------------------------------
// TYPE QUALIFIER WORDS — included in the dedup key.
// These describe what kind of item it is, so "dried cranberries" and
// "fresh cranberries" should NOT merge.
// ---------------------------------------------------------------------------
const TYPE_QUALIFIER_WORDS = new Set([
  'dried', 'fresh', 'frozen', 'canned', 'smoked', 'pickled',
  'raw', 'roasted', 'toasted', 'ground', 'whole', 'powdered',
]);

// ---------------------------------------------------------------------------
// Unit conversion tables for smart quantity merging
// ---------------------------------------------------------------------------
const WEIGHT_IN_OZ = { oz: 1, lbs: 16 };
const VOLUME_IN_TSP = { tsp: 1, tbsp: 3, cups: 48 };

// ---------------------------------------------------------------------------
// Unit map for extracting units embedded in item names
// (e.g., "tablespoons lime juice" → unit: tbsp, item: lime juice)
// ---------------------------------------------------------------------------
const EMBEDDED_UNIT_MAP = {
  tablespoon: 'tbsp', tablespoons: 'tbsp', tbsp: 'tbsp',
  teaspoon: 'tsp', teaspoons: 'tsp', tsp: 'tsp',
  cup: 'cups', cups: 'cups',
  ounce: 'oz', ounces: 'oz', oz: 'oz',
  pound: 'lbs', pounds: 'lbs', lb: 'lbs', lbs: 'lbs',
  clove: 'cloves', cloves: 'cloves',
  bunch: 'bunch', bunches: 'bunch',
  can: 'can', cans: 'can',
  package: 'pkg', pkg: 'pkg', packet: 'pkg',
  head: 'heads', heads: 'heads',
  piece: 'each', pieces: 'each', pc: 'each',
};

// Sorted by length descending so "tablespoons" matches before "tablespoon"
const EMBEDDED_UNIT_NAMES = Object.keys(EMBEDDED_UNIT_MAP)
  .sort((a, b) => b.length - a.length);
const EMBEDDED_UNIT_RE = new RegExp(
  '^(' + EMBEDDED_UNIT_NAMES.map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')s?\\b\\s*(?:of\\s+)?',
  'i'
);

// ---------------------------------------------------------------------------
// cleanItemName
// Strips cooking prep descriptors from the item name.
// Does NOT strip type qualifiers (dried, canned, frozen, etc.) because those
// affect what you'd buy.
// ---------------------------------------------------------------------------
export function cleanItemName(name) {
  return name
    .replace(PREP_DESCRIPTOR_RE, '')  // strip prep words
    .replace(/\s{2,}/g, ' ')          // collapse extra spaces
    .replace(/^[\s,]+|[\s,]+$/g, '')  // trim leading/trailing spaces and commas
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// extractEmbeddedUnit
// If the item name starts with a unit word and has no current unit,
// extracts the unit and returns {item, unit}.
// Example: "tablespoons lime juice" → {item: "lime juice", unit: "tbsp"}
// ---------------------------------------------------------------------------
export function extractEmbeddedUnit(item, currentUnit) {
  // Only extract if there's no unit already assigned
  if (currentUnit && currentUnit !== 'each') return { item, unit: currentUnit };

  const match = item.match(EMBEDDED_UNIT_RE);
  if (!match) return { item, unit: currentUnit };

  const unitWord = match[1].toLowerCase();
  const mappedUnit = EMBEDDED_UNIT_MAP[unitWord];
  if (!mappedUnit) return { item, unit: currentUnit };

  const newItem = item.slice(match[0].length).trim();
  // Only proceed if stripping the unit left a meaningful item name
  if (newItem.length < 2) return { item, unit: currentUnit };

  return { item: newItem, unit: mappedUnit };
}

// ---------------------------------------------------------------------------
// singularizeKey
// Converts common English plurals to singular for dedup purposes.
// "chicken thighs" → "chicken thigh"
// "berries" → "berry"
// "tomatoes" → "tomato"
// ---------------------------------------------------------------------------
export function singularizeKey(name) {
  // ies → y (berries → berry, but not "series")
  if (/[^aeiou]ies$/.test(name)) {
    return name.replace(/ies$/, 'y');
  }
  // oes → o (tomatoes → tomato, potatoes → potato)
  // But not "shoes", "toes" (short words)
  if (/[^st]oes$/.test(name) && name.length > 5) {
    return name.replace(/oes$/, 'o');
  }
  // ves → f (leaves → leaf, halves → half)
  if (/[^aeiou]ves$/.test(name)) {
    return name.replace(/ves$/, 'f');
  }
  // es → e (limes → lime) — only when preceded by consonant+e pattern
  if (/[^aeiou]es$/.test(name) && name.length > 4) {
    return name.replace(/es$/, 'e');
  }
  // plain s → (strip if not making something weird)
  // Don't strip "s" from words like "asparagus", "hummus", "couscous"
  if (
    /[^sxzaiou]s$/.test(name) &&
    name.length > 3
  ) {
    return name.replace(/s$/, '');
  }
  return name;
}

// ---------------------------------------------------------------------------
// buildDedupKey
// Combines singularized item name with any TYPE_QUALIFIER_WORDS found in
// the qualifier string. This prevents "dried cranberries" and "fresh
// cranberries" from merging while still merging "chopped garlic" with
// "minced garlic".
// ---------------------------------------------------------------------------
export function buildDedupKey(item, qualifier) {
  const singularized = singularizeKey(item.toLowerCase().trim());

  // Extract type qualifiers from qualifier string (e.g., "dried, pitted")
  const typeWords = (qualifier || '')
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(w => TYPE_QUALIFIER_WORDS.has(w));

  if (typeWords.length > 0) {
    return `${singularized}::${typeWords.sort().join(',')}`;
  }
  return singularized;
}

// ---------------------------------------------------------------------------
// formatQtyDisplay
// Returns a human-readable quantity string like "2 lbs", "3 tbsp".
// Returns empty string for qty === 0 (pantry/to-taste items).
// ---------------------------------------------------------------------------
export function formatQtyDisplay(qty, unit) {
  if (!qty || qty === 0) return '';
  // Round to 3 decimal places to clean up float arithmetic
  const rounded = Math.round(qty * 1000) / 1000;
  const qtyStr = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return unit ? `${qtyStr} ${unit}` : qtyStr;
}

// ---------------------------------------------------------------------------
// tryMergeQty
// Attempts to add incomingQty (incomingUnit) onto an existing {qty, unit}.
// Handles compatible unit conversions:
//   oz ↔ lbs (16 oz = 1 lb)
//   tsp ↔ tbsp ↔ cups (3 tsp = 1 tbsp, 16 tbsp = 1 cup)
//
// Returns updated {qty, unit} or null if units are incompatible.
// ---------------------------------------------------------------------------
export function tryMergeQty(existingQty, existingUnit, incomingQty, incomingUnit) {
  // Identical units — add, then check if volume can be expressed in a larger unit
  if (existingUnit === incomingUnit) {
    const total = existingQty + incomingQty;
    // Upgrade tsp→tbsp→cups when it makes sense
    if (VOLUME_IN_TSP[existingUnit]) {
      const totalTsp = total * VOLUME_IN_TSP[existingUnit];
      if (totalTsp >= VOLUME_IN_TSP.cups) {
        return { qty: Math.round(totalTsp / VOLUME_IN_TSP.cups * 1000) / 1000, unit: 'cups' };
      }
      // Only upgrade tsp to tbsp (don't downgrade tbsp to tsp or cups to tbsp)
      if (existingUnit === 'tsp' && totalTsp >= VOLUME_IN_TSP.tbsp) {
        return { qty: Math.round(totalTsp / VOLUME_IN_TSP.tbsp * 1000) / 1000, unit: 'tbsp' };
      }
    }
    return { qty: total, unit: existingUnit };
  }

  // Both qty are 0 — no quantity info, just merge
  if (!existingQty && !incomingQty) {
    return { qty: 0, unit: existingUnit || incomingUnit };
  }

  // One is 0 — keep the one with data
  if (!existingQty) return { qty: incomingQty, unit: incomingUnit };
  if (!incomingQty) return { qty: existingQty, unit: existingUnit };

  // Weight conversion: oz ↔ lbs
  if (WEIGHT_IN_OZ[existingUnit] && WEIGHT_IN_OZ[incomingUnit]) {
    const totalOz = existingQty * WEIGHT_IN_OZ[existingUnit]
                  + incomingQty * WEIGHT_IN_OZ[incomingUnit];
    // Prefer the existing unit, convert back
    const converted = totalOz / WEIGHT_IN_OZ[existingUnit];
    return { qty: Math.round(converted * 1000) / 1000, unit: existingUnit };
  }

  // Volume conversion: tsp ↔ tbsp ↔ cups
  if (VOLUME_IN_TSP[existingUnit] && VOLUME_IN_TSP[incomingUnit]) {
    const totalTsp = existingQty * VOLUME_IN_TSP[existingUnit]
                   + incomingQty * VOLUME_IN_TSP[incomingUnit];
    // Use the larger unit that gives a whole number, or fall back to existing
    let best = { qty: totalTsp / VOLUME_IN_TSP[existingUnit], unit: existingUnit };
    // If result is >= 1 cup, prefer cups
    if (totalTsp >= VOLUME_IN_TSP.cups) {
      const inCups = totalTsp / VOLUME_IN_TSP.cups;
      best = { qty: Math.round(inCups * 1000) / 1000, unit: 'cups' };
    } else if (totalTsp >= VOLUME_IN_TSP.tbsp) {
      // Prefer tbsp over tsp when >= 1 tbsp
      const inTbsp = totalTsp / VOLUME_IN_TSP.tbsp;
      best = { qty: Math.round(inTbsp * 1000) / 1000, unit: 'tbsp' };
    } else {
      best = { qty: Math.round(totalTsp * 1000) / 1000, unit: 'tsp' };
    }
    return best;
  }

  // Incompatible units — signal caller to keep separate
  return null;
}

// ---------------------------------------------------------------------------
// isEnhancedPantryStaple
// More semantic pantry matching than exact string equality.
//
// Checks the combined "item + qualifier" string for:
//   1. Single-word pantry names: word-boundary match in item name
//      ("kosher salt" matches pantry staple "salt")
//   2. Multi-word pantry names: all words must appear in item+qualifier
//      ("extra virgin olive oil" matches "olive oil")
//
// pantryList is an array of {name} objects from usePantryStaples().
// ---------------------------------------------------------------------------
export function isEnhancedPantryStaple(item, qualifier, pantryList) {
  if (!pantryList || pantryList.length === 0) return false;
  const combined = `${item} ${qualifier || ''}`.toLowerCase().trim();

  for (const staple of pantryList) {
    const stapleName = (staple.name || '').toLowerCase().trim();
    if (!stapleName) continue;

    const stapleWords = stapleName.split(/\s+/);
    if (stapleWords.length === 1) {
      // Single word: word-boundary match
      const re = new RegExp(`\\b${stapleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      if (re.test(combined)) return true;
    } else {
      // Multi-word: all words must appear (in any order)
      if (stapleWords.every(w => combined.includes(w))) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// postprocessNormalized  (primary export)
//
// Takes the raw array of items from the API response plus the pantry staples
// list from Supabase, and returns a clean, deduplicated, categorized array
// ready for display.
//
// Input shape (from API):
//   [{item, qty, unit, qualifier, category, source, raw}]
//
// Output shape:
//   [{item, qty, unit, qualifier, category, sources, displayQty}]
//   where sources is an array of source strings (recipe titles)
// ---------------------------------------------------------------------------
export function postprocessNormalized(items, pantryStaples = []) {
  if (!Array.isArray(items)) return [];

  // Map: dedupKey → merged entry
  const map = new Map();

  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;

    // --- Step 1: Clean the item name ---
    let item = cleanItemName(String(raw.item || ''));
    if (!item) continue;

    // --- Step 2: Extract unit embedded in item name ---
    const unitResult = extractEmbeddedUnit(item, String(raw.unit || '').toLowerCase().trim());
    item = unitResult.item;
    const unit = unitResult.unit || '';

    const qty = typeof raw.qty === 'number' ? raw.qty : (parseFloat(raw.qty) || 0);
    const qualifier = String(raw.qualifier || '').trim();
    const source = String(raw.source || '');
    // Haiku-provided category (may be empty string if Haiku wasn't confident)
    const haikuCategory = String(raw.category || '');

    // --- Step 3: Pantry filter ---
    if (isEnhancedPantryStaple(item, qualifier, pantryStaples)) continue;

    // --- Step 4: Build dedup key ---
    const key = buildDedupKey(item, qualifier);

    // --- Step 5: Merge or create entry ---
    if (map.has(key)) {
      const existing = map.get(key);

      // Attempt quantity merge
      const merged = tryMergeQty(existing.qty, existing.unit, qty, unit);
      if (merged) {
        existing.qty = merged.qty;
        existing.unit = merged.unit;
      } else {
        // Incompatible units — keep existing, add qty as note
        // (e.g., "2 oz" and "1 each" for cheese — can't merge, keep first)
      }

      // Accumulate sources
      if (source && !existing.sources.includes(source)) {
        existing.sources.push(source);
      }
    } else {
      // Assign category: prefer Haiku's answer, fall back to keyword detection
      const category = detectCategory(item, haikuCategory, qualifier);

      map.set(key, {
        item,
        qty,
        unit,
        qualifier,
        category,
        sources: source ? [source] : [],
      });
    }
  }

  // --- Step 6: Finalize — add displayQty, sort by category then item ---
  return Array.from(map.values()).map(entry => ({
    ...entry,
    displayQty: formatQtyDisplay(entry.qty, entry.unit),
  }));
}
