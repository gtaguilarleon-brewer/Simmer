/**
 * Phase 4: End-to-end pipeline test
 *
 * Tests the full three-layer normalization pipeline without needing to run
 * the Next.js server. Layer 2 (Haiku) is mocked with realistic output —
 * representing what a well-prompted model returns for each input.
 *
 * Run: node test-pipeline.mjs
 */

// ─── Inline Layer 1: ingredientPreprocess.js ─────────────────────────────────
const UNICODE_FRACTIONS = {
  '\u00BD': '0.5', '\u2153': '0.333', '\u00BC': '0.25', '\u00BE': '0.75',
  '\u2154': '0.667', '\u215B': '0.125', '\u2155': '0.2', '\u2156': '0.4',
  '\u2157': '0.6', '\u2158': '0.8', '\u2159': '0.167', '\u215A': '0.833',
  '\u215C': '0.375', '\u215D': '0.625', '\u215E': '0.875',
};
const ENCODING_REPLACEMENTS = [
  ['&amp;', '&'], ['&lt;', '<'], ['&gt;', '>'], ['&quot;', '"'],
  ['&#39;', "'"], ['&apos;', "'"], ['&nbsp;', ' '], ['&#160;', ' '],
  ['&#8211;', '-'], ['&#8212;', '-'], ['&#8220;', '"'], ['&#8221;', '"'],
  ['&#8216;', "'"], ['&#8217;', "'"],
  ['&frac12;', '\u00BD'], ['&frac14;', '\u00BC'], ['&frac34;', '\u00BE'],
  ['\u2013', '-'], ['\u2014', '-'], ['\u2012', '-'], ['\u2015', '-'],
  ['\u201C', '"'], ['\u201D', '"'], ['\u2018', "'"], ['\u2019', "'"],
  ['\u201A', "'"], ['\u201E', '"'], ['\u2026', '...'], ['\u00D7', 'x'],
];
const JUNK_PATTERNS = [
  /^for\s+the\b/i, /^to\s+make\b/i, /^instructions?:?\s*$/i,
  /^directions?:?\s*$/i, /^notes?:?\s*$/i, /^tips?:?\s*$/i,
  /^step\s+\d+/i, /^-{2,}$/, /^[*=_]{2,}$/, /^method:?\s*$/i,
  /^ingredients?:?\s*$/i, /^serves?\s+\d+/i, /^(makes?|yield|yields?)\s/i,
  /^prep\s+time/i, /^cook\s+time/i, /^total\s+time/i,
  /^calories?:/i, /^nutrition/i, /^\d+\s*calories?\b/i,
];
function repairFractions(str) {
  let r = str;
  for (const [char, dec] of Object.entries(UNICODE_FRACTIONS)) {
    const e = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    r = r.replace(new RegExp(`(\\d+)\\s*${e}`, 'g'), (_, w) => String(parseFloat(w) + parseFloat(dec)));
    r = r.replace(new RegExp(e, 'g'), dec);
  }
  r = r.replace(/(\d+)\s+(\d+)\/(\d+)/g, (m, w, n, d) => parseInt(d) === 0 ? m : String(parseFloat(w) + parseInt(n) / parseInt(d)));
  r = r.replace(/\b(\d+)\/(\d+)\b/g, (m, n, d) => { const dv = parseInt(d); return (dv < 2 || dv > 16) ? m : String(Math.round(parseInt(n) / dv * 10000) / 10000); });
  r = r.replace(/^\/2(\s|$)/, '0.5$1').replace(/^\/3(\s|$)/, '0.333$1')
       .replace(/^\/4(\s|$)/, '0.25$1').replace(/^\/8(\s|$)/, '0.125$1');
  return r;
}
function cleanEncoding(str) {
  let r = str;
  for (const [from, to] of ENCODING_REPLACEMENTS) r = r.split(from).join(to);
  r = r.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  r = r.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  r = r.replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, '');
  r = r.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return r;
}
function normalizeWhitespace(str) {
  return str.replace(/\r\n|\r/g, ' ').replace(/\t/g, ' ').replace(/\s{2,}/g, ' ').trim();
}
function isJunkLine(str) {
  const t = (str || '').trim();
  if (t.length < 2) return true;
  if (/^[^a-zA-Z]+$/.test(t)) return true;
  if (JUNK_PATTERNS.some(re => re.test(t))) return true;
  return false;
}
function preprocessOne(raw) {
  let r = String(raw || '');
  r = cleanEncoding(r);
  r = repairFractions(r);
  r = normalizeWhitespace(r);
  return r;
}
function preprocessIngredients(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(ing => {
      if (!ing || typeof ing !== 'object') return null;
      return { ...ing, name: preprocessOne(ing.name || '') };
    })
    .filter(ing => ing !== null && !isJunkLine(ing.name));
}

// ─── Inline Layer 3: ingredientPostprocess.js ────────────────────────────────
const PREP_DESCRIPTORS = [
  'finely chopped', 'roughly chopped', 'coarsely chopped', 'thinly sliced',
  'thickly sliced', 'roughly torn', 'finely grated', 'coarsely grated',
  'finely diced', 'roughly diced', 'finely minced', 'lightly beaten',
  'freshly squeezed', 'freshly grated', 'freshly ground',
  'patted dry', 'room temperature', 'at room temperature',
  'seeds removed', 'seeds separated', 'pit removed', 'stems removed',
  'rinsed and drained', 'drained and rinsed',
  'chopped', 'minced', 'sliced', 'grated',
  'shredded', 'julienned', 'cubed', 'halved', 'quartered',
  'peeled', 'deveined', 'trimmed', 'warmed', 'softened',
  'melted', 'thawed', 'rinsed', 'drained', 'pressed',
  'seeded', 'pitted', 'zested', 'juiced', 'crumbled', 'torn',
  'beaten', 'whisked', 'sifted', 'packed', 'heaped', 'leveled',
];
const PREP_DESCRIPTOR_RE = new RegExp(
  '\\b(' + PREP_DESCRIPTORS.map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'gi'
);
const TYPE_QUALIFIER_WORDS = new Set([
  'dried', 'fresh', 'frozen', 'canned', 'smoked', 'pickled',
  'raw', 'roasted', 'toasted', 'ground', 'whole', 'powdered',
]);
const WEIGHT_IN_OZ = { oz: 1, lbs: 16 };
const VOLUME_IN_TSP = { tsp: 1, tbsp: 3, cups: 48 };
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
const EMBEDDED_UNIT_NAMES = Object.keys(EMBEDDED_UNIT_MAP).sort((a, b) => b.length - a.length);
const EMBEDDED_UNIT_RE = new RegExp(
  '^(' + EMBEDDED_UNIT_NAMES.map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')s?\\b\\s*(?:of\\s+)?', 'i'
);
const CATEGORY_ORDER = [
  "Produce", "Meat & Seafood", "Dairy & Refrigerated", "Bread & Bakery",
  "Dry Goods & Pasta", "Canned & Jarred", "Oils, Sauces & Condiments",
  "Frozen", "Beverages", "Baby & Kids", "Household & Paper", "Other",
];
function cleanItemName(name) {
  return name.replace(PREP_DESCRIPTOR_RE, '').replace(/\s{2,}/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '').toLowerCase();
}
function extractEmbeddedUnit(item, currentUnit) {
  if (currentUnit && currentUnit !== 'each') return { item, unit: currentUnit };
  const match = item.match(EMBEDDED_UNIT_RE);
  if (!match) return { item, unit: currentUnit };
  const unitWord = match[1].toLowerCase();
  const mappedUnit = EMBEDDED_UNIT_MAP[unitWord];
  if (!mappedUnit) return { item, unit: currentUnit };
  const newItem = item.slice(match[0].length).trim();
  if (newItem.length < 2) return { item, unit: currentUnit };
  return { item: newItem, unit: mappedUnit };
}
function singularizeKey(name) {
  if (/[^aeiou]ies$/.test(name)) return name.replace(/ies$/, 'y');
  if (/[^st]oes$/.test(name) && name.length > 5) return name.replace(/oes$/, 'o');
  if (/[^aeiou]ves$/.test(name)) return name.replace(/ves$/, 'f');
  if (/[^aeiou]es$/.test(name) && name.length > 4) return name.replace(/es$/, 'e');
  if (/[^sxzaiou]s$/.test(name) && name.length > 3) return name.replace(/s$/, '');
  return name;
}
function buildDedupKey(item, qualifier) {
  const singularized = singularizeKey(item.toLowerCase().trim());
  const typeWords = (qualifier || '').toLowerCase().split(/[\s,]+/).filter(w => TYPE_QUALIFIER_WORDS.has(w));
  return typeWords.length > 0 ? `${singularized}::${typeWords.sort().join(',')}` : singularized;
}
function formatQtyDisplay(qty, unit) {
  if (!qty || qty === 0) return '';
  const rounded = Math.round(qty * 1000) / 1000;
  return unit ? `${rounded} ${unit}` : String(rounded);
}
function tryMergeQty(eq, eu, iq, iu) {
  if (eu === iu) {
    const total = eq + iq;
    if (VOLUME_IN_TSP[eu]) {
      const totalTsp = total * VOLUME_IN_TSP[eu];
      if (totalTsp >= VOLUME_IN_TSP.cups) return { qty: Math.round(totalTsp / 48 * 1000) / 1000, unit: 'cups' };
      if (eu === 'tsp' && totalTsp >= VOLUME_IN_TSP.tbsp) return { qty: Math.round(totalTsp / 3 * 1000) / 1000, unit: 'tbsp' };
    }
    return { qty: total, unit: eu };
  }
  if (!eq && !iq) return { qty: 0, unit: eu || iu };
  if (!eq) return { qty: iq, unit: iu };
  if (!iq) return { qty: eq, unit: eu };
  if (WEIGHT_IN_OZ[eu] && WEIGHT_IN_OZ[iu]) {
    const totalOz = eq * WEIGHT_IN_OZ[eu] + iq * WEIGHT_IN_OZ[iu];
    return { qty: Math.round(totalOz / WEIGHT_IN_OZ[eu] * 1000) / 1000, unit: eu };
  }
  if (VOLUME_IN_TSP[eu] && VOLUME_IN_TSP[iu]) {
    const totalTsp = eq * VOLUME_IN_TSP[eu] + iq * VOLUME_IN_TSP[iu];
    if (totalTsp >= 48) return { qty: Math.round(totalTsp / 48 * 1000) / 1000, unit: 'cups' };
    if (totalTsp >= 3)  return { qty: Math.round(totalTsp / 3 * 1000) / 1000, unit: 'tbsp' };
    return { qty: Math.round(totalTsp * 1000) / 1000, unit: 'tsp' };
  }
  return null;
}
function isEnhancedPantryStaple(item, qualifier, pantryList) {
  if (!pantryList || pantryList.length === 0) return false;
  const combined = `${item} ${qualifier || ''}`.toLowerCase().trim();
  for (const staple of pantryList) {
    const stapleName = (staple.name || '').toLowerCase().trim();
    if (!stapleName) continue;
    const stapleWords = stapleName.split(/\s+/);
    if (stapleWords.length === 1) {
      const re = new RegExp(`\\b${stapleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      if (re.test(combined)) return true;
    } else {
      if (stapleWords.every(w => combined.includes(w))) return true;
    }
  }
  return false;
}
function detectCategory(itemName, haikuCategory = '', qualifier = '') {
  if (haikuCategory && CATEGORY_ORDER.includes(haikuCategory)) return haikuCategory;
  return 'Other'; // simplified for test — real version uses keyword lists
}
function postprocessNormalized(items, pantryStaples = []) {
  if (!Array.isArray(items)) return [];
  const map = new Map();
  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue;
    let item = cleanItemName(String(raw.item || ''));
    if (!item) continue;
    const unitResult = extractEmbeddedUnit(item, String(raw.unit || '').toLowerCase().trim());
    item = unitResult.item;
    const unit = unitResult.unit || '';
    const qty = typeof raw.qty === 'number' ? raw.qty : (parseFloat(raw.qty) || 0);
    const qualifier = String(raw.qualifier || '').trim();
    const source = String(raw.source || '');
    const haikuCategory = String(raw.category || '');
    if (isEnhancedPantryStaple(item, qualifier, pantryStaples)) continue;
    const key = buildDedupKey(item, qualifier);
    if (map.has(key)) {
      const existing = map.get(key);
      const merged = tryMergeQty(existing.qty, existing.unit, qty, unit);
      if (merged) { existing.qty = merged.qty; existing.unit = merged.unit; }
      if (source && !existing.sources.includes(source)) existing.sources.push(source);
    } else {
      const category = detectCategory(item, haikuCategory, qualifier);
      map.set(key, { item, qty, unit, qualifier, category, sources: source ? [source] : [] });
    }
  }
  return Array.from(map.values()).map(entry => ({ ...entry, displayQty: formatQtyDisplay(entry.qty, entry.unit) }));
}

// ─── Test harness ─────────────────────────────────────────────────────────────
let pass = 0, fail = 0, warn = 0;
function t(label, actual, expected, notes = '') {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  const icon = ok ? '✓' : '✗';
  console.log(`${icon} ${label}`);
  if (!ok) {
    console.log(`    expected: ${JSON.stringify(expected)}`);
    console.log(`    got:      ${JSON.stringify(actual)}`);
    if (notes) console.log(`    note: ${notes}`);
    fail++;
  } else {
    pass++;
  }
}
function section(name) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('─'.repeat(60));
}

// ─── SECTION 1: Layer 1 — preprocessIngredients ──────────────────────────────
section('Layer 1: preprocessIngredients');

// Test: unicode fraction repair
{
  const raw = [{ name: '1\u00BD cups Greek yogurt', source: 'Tikka Masala' }];
  const out = preprocessIngredients(raw);
  t('Unicode ½ mixed number', out[0].name, '1.5 cups Greek yogurt');
}
{
  const raw = [{ name: '\u00BC tsp salt', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  t('Standalone ¼ unicode fraction', out[0].name, '0.25 tsp salt');
}
{
  const raw = [{ name: '1&frac12; cups flour', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  t('HTML entity &frac12; (not string concat)', out[0].name, '1.5 cups flour');
}
{
  const raw = [{ name: '/2 cup milk', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  t('Mangled /2 at start of string', out[0].name, '0.5 cup milk');
}
{
  const raw = [{ name: '2\u00BC cups', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  t('Mixed number 2¼', out[0].name, '2.25 cups');
}
{
  const raw = [{ name: '3/4 cup buttermilk', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  t('ASCII fraction 3/4', out[0].name, '0.75 cup buttermilk');
}
{
  const raw = [{ name: '1 1/2 cups water', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  t('ASCII mixed fraction 1 1/2', out[0].name, '1.5 cups water');
}
// Test: encoding cleanup
{
  const raw = [{ name: 'salt &amp; pepper', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  t('HTML entity &amp;', out[0].name, 'salt & pepper');
}
{
  const raw = [{ name: 'chicken\u2014 breast', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  t('Em dash → hyphen', out[0].name, 'chicken- breast');
}
// Test: junk filtering
{
  const raw = [
    { name: 'For the marinade:', source: 'Recipe' },
    { name: '2 cloves garlic', source: 'Recipe' },
    { name: '---', source: 'Recipe' },
    { name: 'Step 1: preheat oven', source: 'Recipe' },
    { name: 'Serves 4', source: 'Recipe' },
    { name: 'Instructions:', source: 'Recipe' },
    { name: '1', source: 'Recipe' },
  ];
  const out = preprocessIngredients(raw);
  t('Junk lines filtered — only real ingredient survives', out.length, 1);
  t('Real ingredient preserved through junk filter', out[0]?.name, '2 cloves garlic');
}
// Test: source preservation
{
  const raw = [{ name: '2 cups rice', source: 'Stir Fry', isEasyMeal: true }];
  const out = preprocessIngredients(raw);
  t('Source field preserved', out[0].source, 'Stir Fry');
  t('Extra fields preserved (isEasyMeal)', out[0].isEasyMeal, true);
}

// ─── SECTION 2: Layer 3 — postprocessNormalized (with mocked Haiku output) ───
section('Layer 3: postprocessNormalized — plan test cases (mocked Haiku)');

// Pantry list used for relevant tests.
// Note: using "black pepper" not "pepper" — single-word "pepper" with word-boundary
// matching would incorrectly filter "red bell pepper". Real user pantries would
// have "black pepper" (multi-word), which only matches when both "black" AND
// "pepper" appear in the ingredient string.
const PANTRY = [
  { name: 'olive oil' }, { name: 'salt' }, { name: 'black pepper' },
  { name: 'butter' }, { name: 'garlic' }, { name: 'cooking oil' },
];

// Test case: 1½ cups Greek yogurt (or sour cream)
{
  const items = [{ item: 'greek yogurt', qty: 1.5, unit: 'cups', qualifier: '', category: 'Dairy & Refrigerated', source: 'Tikka Masala', raw: '1.5 cups Greek yogurt (or sour cream)' }];
  const out = postprocessNormalized(items, PANTRY);
  t('Greek yogurt: item name', out[0]?.item, 'greek yogurt');
  t('Greek yogurt: qty', out[0]?.qty, 1.5);
  t('Greek yogurt: unit', out[0]?.unit, 'cups');
  t('Greek yogurt: displayQty', out[0]?.displayQty, '1.5 cups');
}

// Test case: salt and pepper to taste (both pantry filtered)
// "salt" → word-boundary matches pantry staple "salt" ✓
// "pepper" → pantry has "black pepper" (multi-word), NOT single-word "pepper".
//   "pepper" alone does NOT match "black pepper" (requires "black" to appear too).
//   So plain "pepper" would NOT be filtered by this pantry — it would stay.
//   In real use: user's pantry would have "black pepper", and Haiku splits
//   "salt and pepper to taste" into item:"salt" and item:"black pepper".
//   Since we can't test Haiku live, we simulate Haiku saying item:"black pepper".
{
  const items = [
    { item: 'salt', qty: 0, unit: '', qualifier: '', category: 'Oils, Sauces & Condiments', source: 'Roasted Chicken', raw: 'salt and pepper to taste' },
    { item: 'black pepper', qty: 0, unit: '', qualifier: '', category: 'Oils, Sauces & Condiments', source: 'Roasted Chicken', raw: 'salt and pepper to taste' },
  ];
  const out = postprocessNormalized(items, PANTRY);
  t('Salt pantry filtered (word-boundary)', out.find(i => i.item === 'salt'), undefined);
  t('Black pepper pantry filtered (multi-word)', out.find(i => i.item === 'black pepper'), undefined);
}

// Test case: 2-3 cloves garlic, minced (garlic is pantry item)
{
  const items = [{ item: 'garlic', qty: 3, unit: 'cloves', qualifier: 'minced', category: 'Produce', source: 'Pasta', raw: '2-3 cloves garlic, minced' }];
  const out = postprocessNormalized(items, PANTRY);
  t('Garlic pantry filtered (word-boundary: "garlic" in pantry)', out.length, 0);
}

// Test case: 1 (14 oz) can coconut milk
{
  const items = [{ item: 'coconut milk', qty: 1, unit: 'can', qualifier: '', category: 'Canned & Jarred', source: 'Thai Curry', raw: '1 (14 oz) can coconut milk' }];
  const out = postprocessNormalized(items, PANTRY);
  t('Coconut milk: item', out[0]?.item, 'coconut milk');
  t('Coconut milk: unit', out[0]?.unit, 'can');
  t('Coconut milk: qty', out[0]?.qty, 1);
}

// Test case: tablesoons lime juice (typo corrected by Haiku)
{
  const items = [{ item: 'lime juice', qty: 1, unit: 'tbsp', qualifier: '', category: 'Produce', source: 'Fish Tacos', raw: 'tablesoons lime juice' }];
  const out = postprocessNormalized(items, PANTRY);
  t('Lime juice (typo corrected): item', out[0]?.item, 'lime juice');
  t('Lime juice (typo corrected): unit', out[0]?.unit, 'tbsp');
}

// Test case: 2 lbs chicken thighs, bone-in
{
  const items = [{ item: 'chicken thighs', qty: 2, unit: 'lbs', qualifier: 'bone-in', category: 'Meat & Seafood', source: 'Sheet Pan Dinner', raw: '2 lbs chicken thighs, bone-in' }];
  const out = postprocessNormalized(items, PANTRY);
  t('Chicken thighs: item', out[0]?.item, 'chicken thighs');
  t('Chicken thighs: qty', out[0]?.qty, 2);
  t('Chicken thighs: qualifier', out[0]?.qualifier, 'bone-in');
}

// Test case: 1 onion, finely diced — finely diced should go to qualifier, not item
{
  const items = [{ item: 'onion', qty: 1, unit: 'each', qualifier: 'finely diced', category: 'Produce', source: 'Soup', raw: '1 onion, finely diced' }];
  const out = postprocessNormalized(items, PANTRY);
  t('Onion: item (no prep words)', out[0]?.item, 'onion');
  t('Onion: qualifier preserved', out[0]?.qualifier, 'finely diced');
}

// Test case: Extra virgin olive oil (pantry filtered)
{
  const items = [{ item: 'olive oil', qty: 0, unit: '', qualifier: 'extra virgin', category: 'Oils, Sauces & Condiments', source: 'Roasted Veg', raw: 'extra virgin olive oil' }];
  const out = postprocessNormalized(items, PANTRY);
  t('Olive oil pantry filtered (multi-word match)', out.length, 0);
}

// Test case: ½ red bell pepper, seeds removed
{
  const items = [{ item: 'red bell pepper', qty: 0.5, unit: 'each', qualifier: 'seeds removed', category: 'Produce', source: 'Stir Fry', raw: '0.5 red bell pepper, seeds removed' }];
  const out = postprocessNormalized(items, PANTRY);
  t('Red bell pepper: item (seeds removed stripped from item)', out[0]?.item, 'red bell pepper');
  t('Red bell pepper: qty', out[0]?.qty, 0.5);
}

// Test case: a handful of fresh basil leaves
{
  const items = [{ item: 'basil', qty: 1, unit: 'bunch', qualifier: 'fresh', category: 'Produce', source: 'Caprese', raw: 'a handful of fresh basil leaves' }];
  const out = postprocessNormalized(items, PANTRY);
  t('Basil: item', out[0]?.item, 'basil');
  t('Basil: unit', out[0]?.unit, 'bunch');
}

// Test case: one 28-ounce can crushed tomatoes
{
  const items = [{ item: 'crushed tomatoes', qty: 1, unit: 'can', qualifier: '28 oz', category: 'Canned & Jarred', source: 'Marinara', raw: 'one 28-ounce can crushed tomatoes' }];
  const out = postprocessNormalized(items, PANTRY);
  t('Crushed tomatoes: item', out[0]?.item, 'crushed tomatoes');
  t('Crushed tomatoes: qualifier', out[0]?.qualifier, '28 oz');
}

// Test case: freshly ground black pepper (pantry filtered)
{
  const items = [{ item: 'black pepper', qty: 0, unit: '', qualifier: 'freshly ground', category: 'Oils, Sauces & Condiments', source: 'Recipe', raw: 'freshly ground black pepper' }];
  const out = postprocessNormalized(items, PANTRY);
  t('Black pepper pantry filtered (multi-word match)', out.length, 0);
}

// Test case: 3 tablespoons finely chopped cilantro
// After cleanItemName: "finely chopped" stripped from item if Haiku put it there
{
  const items = [{ item: 'cilantro', qty: 3, unit: 'tbsp', qualifier: 'finely chopped', category: 'Produce', source: 'Fish Tacos', raw: '3 tablespoons finely chopped cilantro' }];
  const out = postprocessNormalized(items, PANTRY);
  t('Cilantro: clean item name', out[0]?.item, 'cilantro');
  t('Cilantro: qty', out[0]?.qty, 3);
  t('Cilantro: unit', out[0]?.unit, 'tbsp');
}

// ─── SECTION 3: Multi-recipe dedup scenarios ──────────────────────────────────
section('Layer 3: Multi-recipe dedup + unit merging');

// Scenario: lime juice from two recipes, same unit
{
  const items = [
    { item: 'lime juice', qty: 2, unit: 'tbsp', qualifier: '', category: 'Produce', source: 'Fish Tacos', raw: '2 tbsp lime juice' },
    { item: 'lime juice', qty: 1, unit: 'tbsp', qualifier: '', category: 'Produce', source: 'Guacamole', raw: '1 tbsp lime juice' },
  ];
  const out = postprocessNormalized(items, []);
  t('Lime juice dedup: single entry', out.length, 1);
  t('Lime juice dedup: qty merged to 3', out[0]?.qty, 3);
  t('Lime juice dedup: sources from both recipes', out[0]?.sources.length, 2);
}

// Scenario: chicken thighs vs chicken thigh (singular/plural dedup)
{
  const items = [
    { item: 'chicken thighs', qty: 2, unit: 'lbs', qualifier: '', category: 'Meat & Seafood', source: 'Sheet Pan', raw: '2 lbs chicken thighs' },
    { item: 'chicken thigh', qty: 1, unit: 'lbs', qualifier: '', category: 'Meat & Seafood', source: 'Stew', raw: '1 lb chicken thigh' },
  ];
  const out = postprocessNormalized(items, []);
  t('Chicken thigh/thighs: singularized and merged', out.length, 1);
  t('Chicken thigh/thighs: qty merged to 3 lbs', out[0]?.qty, 3);
}

// Scenario: oz + lbs unit conversion
{
  const items = [
    { item: 'chicken breast', qty: 8, unit: 'oz', qualifier: '', category: 'Meat & Seafood', source: 'Recipe A', raw: '8 oz chicken breast' },
    { item: 'chicken breast', qty: 1, unit: 'lbs', qualifier: '', category: 'Meat & Seafood', source: 'Recipe B', raw: '1 lb chicken breast' },
  ];
  const out = postprocessNormalized(items, []);
  t('oz+lbs merge: single entry', out.length, 1);
  t('oz+lbs merge: 8oz + 16oz = 24 oz', out[0]?.qty, 24);
  t('oz+lbs merge: unit stays oz (existing unit)', out[0]?.unit, 'oz');
}

// Scenario: tsp + tbsp volume conversion
{
  const items = [
    { item: 'soy sauce', qty: 1, unit: 'tbsp', qualifier: '', category: 'Oils, Sauces & Condiments', source: 'Stir Fry', raw: '1 tbsp soy sauce' },
    { item: 'soy sauce', qty: 3, unit: 'tsp', qualifier: '', category: 'Oils, Sauces & Condiments', source: 'Marinade', raw: '3 tsp soy sauce' },
  ];
  const out = postprocessNormalized(items, []);
  t('tsp+tbsp merge: single entry', out.length, 1);
  t('tsp+tbsp merge: 1tbsp + 3tsp = 2 tbsp', out[0]?.qty, 2);
  t('tsp+tbsp merge: unit is tbsp', out[0]?.unit, 'tbsp');
}

// Scenario: dried cranberries vs fresh cranberries should NOT merge
{
  const items = [
    { item: 'cranberries', qty: 0.5, unit: 'cups', qualifier: 'dried', category: 'Dry Goods & Pasta', source: 'Salad', raw: '1/2 cup dried cranberries' },
    { item: 'cranberries', qty: 1, unit: 'cups', qualifier: 'fresh', category: 'Produce', source: 'Smoothie', raw: '1 cup fresh cranberries' },
  ];
  const out = postprocessNormalized(items, []);
  t('Dried vs fresh cranberries: NOT merged (different type qualifiers)', out.length, 2);
}

// Scenario: prep descriptor removed from item name in fallback case
{
  const items = [
    { item: 'finely chopped cilantro', qty: 2, unit: 'tbsp', qualifier: '', category: 'Produce', source: 'Tacos', raw: '2 tbsp finely chopped cilantro' },
  ];
  const out = postprocessNormalized(items, []);
  t('Prep descriptor stripped from item name in Layer 3', out[0]?.item, 'cilantro');
}

// Scenario: embedded unit in item name extracted
{
  const items = [
    { item: 'tablespoons lime juice', qty: 0, unit: '', qualifier: '', category: 'Produce', source: 'Fish Tacos', raw: 'tablespoons lime juice' },
  ];
  const out = postprocessNormalized(items, []);
  t('Embedded unit extracted from item name', out[0]?.item, 'lime juice');
  t('Embedded unit placed in unit field', out[0]?.unit, 'tbsp');
}

// Scenario: incompatible units (oz + each) — kept, not crashed
{
  const items = [
    { item: 'parmesan', qty: 4, unit: 'oz', qualifier: '', category: 'Dairy & Refrigerated', source: 'Pasta', raw: '4 oz parmesan' },
    { item: 'parmesan', qty: 1, unit: 'each', qualifier: '', category: 'Dairy & Refrigerated', source: 'Salad', raw: '1 block parmesan' },
  ];
  const out = postprocessNormalized(items, []);
  t('Incompatible units (oz+each): no crash, entry kept', out.length, 1);
  t('Incompatible units: existing qty preserved', out[0]?.qty, 4);
  t('Incompatible units: both sources captured', out[0]?.sources.length, 2);
}

// ─── SECTION 4: Full pipeline (Layer 1 + mocked Layer 2 + Layer 3) ────────────
section('Full pipeline: Layer 1 → (mock API) → Layer 3');

// Simulate what happens when raw recipe data flows through the complete pipeline
const mockMealData = [
  { name: '1\u00BD cups chicken broth', source: 'Soup' },
  { name: 'For the base:', source: 'Soup' },          // junk → filtered by L1
  { name: '2 cloves garlic, minced', source: 'Soup' }, // garlic = pantry
  { name: '1 (14 oz) can diced tomatoes', source: 'Soup' },
  { name: '0.5 lbs ground beef', source: 'Bolognese' },
  { name: '1 (14 oz) can diced tomatoes', source: 'Bolognese' }, // same item, dedup in L3
  { name: '3 tablespoons finely chopped parsley', source: 'Bolognese' },
  { name: '---', source: 'Bolognese' },                 // junk → filtered by L1
  { name: 'salt to taste', source: 'Bolognese' },       // pantry
  { name: '8 oz chicken thighs', source: 'Sheet Pan' },
  { name: '0.5 lbs chicken thighs', source: 'Sheet Pan' }, // same item, different unit → merge
];

// Layer 1
const preprocessed = preprocessIngredients(mockMealData);
t('L1: junk lines filtered (2 removed)', preprocessed.length, mockMealData.length - 2);

// Mock Layer 2 (realistic Haiku output for the non-junk, non-pantry items)
const mockApiResponse = [
  { item: 'chicken broth', qty: 1.5, unit: 'cups', qualifier: '', category: 'Canned & Jarred', source: 'Soup', raw: '1.5 cups chicken broth' },
  { item: 'garlic', qty: 2, unit: 'cloves', qualifier: 'minced', category: 'Produce', source: 'Soup', raw: '2 cloves garlic, minced' },
  { item: 'diced tomatoes', qty: 1, unit: 'can', qualifier: '14 oz', category: 'Canned & Jarred', source: 'Soup', raw: '1 (14 oz) can diced tomatoes' },
  { item: 'ground beef', qty: 0.5, unit: 'lbs', qualifier: '', category: 'Meat & Seafood', source: 'Bolognese', raw: '0.5 lbs ground beef' },
  { item: 'diced tomatoes', qty: 1, unit: 'can', qualifier: '14 oz', category: 'Canned & Jarred', source: 'Bolognese', raw: '1 (14 oz) can diced tomatoes' },
  { item: 'parsley', qty: 3, unit: 'tbsp', qualifier: 'finely chopped', category: 'Produce', source: 'Bolognese', raw: '3 tablespoons finely chopped parsley' },
  { item: 'salt', qty: 0, unit: '', qualifier: '', category: 'Oils, Sauces & Condiments', source: 'Bolognese', raw: 'salt to taste' },
  { item: 'chicken thighs', qty: 8, unit: 'oz', qualifier: '', category: 'Meat & Seafood', source: 'Sheet Pan', raw: '8 oz chicken thighs' },
  { item: 'chicken thighs', qty: 0.5, unit: 'lbs', qualifier: '', category: 'Meat & Seafood', source: 'Sheet Pan', raw: '0.5 lbs chicken thighs' },
];

// Layer 3 (with pantry)
const result = postprocessNormalized(mockApiResponse, PANTRY);

t('L3: garlic pantry filtered', result.find(i => i.item === 'garlic'), undefined);
t('L3: salt pantry filtered', result.find(i => i.item === 'salt'), undefined);
t('L3: diced tomatoes deduped (2 recipes → 1 entry)', result.filter(i => i.item === 'diced tomatoes').length, 1);
t('L3: diced tomatoes qty merged (1+1=2 cans)', result.find(i => i.item === 'diced tomatoes')?.qty, 2);
t('L3: diced tomatoes sources from 2 recipes', result.find(i => i.item === 'diced tomatoes')?.sources.length, 2);
t('L3: chicken thighs oz+lbs merged', result.filter(i => i.item === 'chicken thighs').length, 1);
t('L3: chicken thighs total = 8oz + 8oz (0.5lb) = 16oz', result.find(i => i.item === 'chicken thighs')?.qty, 16);
t('L3: parsley item clean (finely chopped stripped)', result.find(i => i.item === 'parsley')?.item, 'parsley');
t('L3: parsley qualifier preserved', result.find(i => i.item === 'parsley')?.qualifier, 'finely chopped');
t('L3: olive oil not present (pantry filtered)', result.find(i => i.item === 'olive oil'), undefined);

// Verify final list has expected items
const expectedItems = ['chicken broth', 'diced tomatoes', 'ground beef', 'parsley', 'chicken thighs'];
expectedItems.forEach(name => {
  t(`L3: "${name}" in final grocery list`, !!result.find(i => i.item === name), true);
});

// ─── SECTION 5: Layer 1 edge cases ───────────────────────────────────────────
section('Edge cases: encoding, fractions, junk patterns');

// Zero-width characters
{
  const raw = [{ name: '2 tbsp\u200B olive oil', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  t('Zero-width space stripped', out[0]?.name, '2 tbsp olive oil');
}
// Numeric HTML entity
{
  const raw = [{ name: '1&#189; cups milk', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  // &#189; = ½ → cleanEncoding converts → repairFractions converts
  t('Numeric HTML entity &#189; → ½ → 1.5', out[0]?.name, '1.5 cups milk');
}
// "Serves 4" junk line
{
  const raw = [{ name: 'Serves 4', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  t('Serves N junk line filtered', out.length, 0);
}
// Very short ingredient (< 2 chars)
{
  const raw = [{ name: '1', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  t('Single char filtered as junk', out.length, 0);
}
// Real short ingredient that should pass
{
  const raw = [{ name: '2 eggs', source: 'Recipe' }];
  const out = preprocessIngredients(raw);
  t('Short but valid "2 eggs" passes', out.length, 1);
}

// ─── RESULTS ──────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log(`  RESULTS: ${pass} passed, ${fail} failed`);
console.log('═'.repeat(60));
if (fail > 0) process.exit(1);
