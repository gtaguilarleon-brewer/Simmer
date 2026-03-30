/**
 * Layer 1: Pre-processing pipeline for raw ingredient text.
 *
 * Handles encoding fixes, fraction repair, and junk filtering before
 * sending ingredients to the normalization API. Pure functions — no async,
 * no external deps, easy to unit test.
 *
 * Usage:
 *   import { preprocessIngredients } from '../lib/ingredientPreprocess';
 *   const cleaned = preprocessIngredients(rawIngredients); // [{name, source, ...}]
 */

// ---------------------------------------------------------------------------
// Unicode fraction → decimal string map
// Keys are the actual Unicode characters; values are string decimals so they
// splice cleanly back into the ingredient text.
// ---------------------------------------------------------------------------
const UNICODE_FRACTIONS = {
  '\u00BD': '0.5',    // ½
  '\u2153': '0.333',  // ⅓
  '\u00BC': '0.25',   // ¼
  '\u00BE': '0.75',   // ¾
  '\u2154': '0.667',  // ⅔
  '\u215B': '0.125',  // ⅛
  '\u2155': '0.2',    // ⅕
  '\u2156': '0.4',    // ⅖
  '\u2157': '0.6',    // ⅗
  '\u2158': '0.8',    // ⅘
  '\u2159': '0.167',  // ⅙
  '\u215A': '0.833',  // ⅚
  '\u215C': '0.375',  // ⅜
  '\u215D': '0.625',  // ⅝
  '\u215E': '0.875',  // ⅞
};

// ---------------------------------------------------------------------------
// HTML entities and problematic Unicode characters that survive web scraping
// ---------------------------------------------------------------------------
const ENCODING_REPLACEMENTS = [
  // HTML named entities
  ['&amp;',   '&'],
  ['&lt;',    '<'],
  ['&gt;',    '>'],
  ['&quot;',  '"'],
  ['&#39;',   "'"],
  ['&apos;',  "'"],
  ['&nbsp;',  ' '],
  ['&#160;',  ' '],
  // Numeric dash entities
  ['&#8211;', '-'],
  ['&#8212;', '-'],
  // Numeric quote entities
  ['&#8220;', '"'],
  ['&#8221;', '"'],
  ['&#8216;', "'"],
  ['&#8217;', "'"],
  // Fraction HTML entities — map to Unicode chars so repairFractions handles
  // mixed numbers correctly. '1&frac12;' must become '1½' → '1.5', NOT '10.5'.
  ['&frac12;', '\u00BD'],  // → ½
  ['&frac14;', '\u00BC'],  // → ¼
  ['&frac34;', '\u00BE'],  // → ¾
  // Unicode typographic dashes → plain hyphen
  ['\u2013', '-'],  // en dash
  ['\u2014', '-'],  // em dash
  ['\u2012', '-'],  // figure dash
  ['\u2015', '-'],  // horizontal bar
  // Unicode typographic quotes → plain quotes
  ['\u201C', '"'],  // left double quote "
  ['\u201D', '"'],  // right double quote "
  ['\u2018', "'"],  // left single quote '
  ['\u2019', "'"],  // right single quote ' (also apostrophe)
  ['\u201A', "'"],  // single low-9 quote
  ['\u201E', '"'],  // double low-9 quote
  // Ellipsis
  ['\u2026', '...'],
  // Multiplication sign (sometimes used instead of "x")
  ['\u00D7', 'x'],
];

// ---------------------------------------------------------------------------
// Patterns that indicate a line is a section header, instruction, or other
// non-ingredient content that should be filtered out.
// ---------------------------------------------------------------------------
const JUNK_PATTERNS = [
  /^for\s+the\b/i,              // "For the sauce:", "For the marinade"
  /^to\s+make\b/i,              // "To make the dressing:"
  /^instructions?:?\s*$/i,      // "Instructions:"
  /^directions?:?\s*$/i,        // "Directions:"
  /^notes?:?\s*$/i,             // "Note:", "Notes"
  /^tips?:?\s*$/i,              // "Tip:", "Tips"
  /^step\s+\d+/i,               // "Step 1", "Step 2:"
  /^-{2,}$/,                    // "---" dividers
  /^[*=_]{2,}$/,                // "***", "===", "___" dividers
  /^method:?\s*$/i,             // "Method:"
  /^ingredients?:?\s*$/i,       // "Ingredients:" (header, not an ingredient)
  /^serves?\s+\d+/i,            // "Serves 4"
  /^(makes?|yield|yields?)\s/i, // "Makes 2 dozen"
  /^prep\s+time/i,              // "Prep time: 10 min"
  /^cook\s+time/i,              // "Cook time: 30 min"
  /^total\s+time/i,             // "Total time: 40 min"
  /^calories?:/i,               // "Calories: 320"
  /^nutrition/i,                // "Nutrition info:"
  /^\d+\s*calories?\b/i,        // "320 calories"
];

// ---------------------------------------------------------------------------
// repairFractions
// Converts Unicode fractions and ASCII vulgar fractions to decimal strings
// so the AI (and fallback parser) never has to deal with them.
//
// Handles:
//   "1½ cups"   → "1.5 cups"
//   "½ cup"     → "0.5 cup"
//   "1 1/2 cup" → "1.5 cup"
//   "3/4 cup"   → "0.75 cup"
//   "/2 cup"    → "0.5 cup"   (mangled ½)
//   "/4 tsp"    → "0.25 tsp"  (mangled ¼)
// ---------------------------------------------------------------------------
export function repairFractions(str) {
  let result = str;

  // Step 1: Unicode fraction characters
  for (const [char, decimal] of Object.entries(UNICODE_FRACTIONS)) {
    // Escape the Unicode char for use in RegExp
    const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Mixed number: digit (optionally with space) immediately before fraction char
    // e.g. "1½" or "1 ½" → "1.5"
    result = result.replace(new RegExp(`(\\d+)\\s*${escaped}`, 'g'), (_, whole) => {
      return String(parseFloat(whole) + parseFloat(decimal));
    });

    // Standalone fraction char
    result = result.replace(new RegExp(escaped, 'g'), decimal);
  }

  // Step 2: ASCII mixed fractions like "1 1/2" → "1.5"
  result = result.replace(/(\d+)\s+(\d+)\/(\d+)/g, (match, whole, num, den) => {
    const denominator = parseInt(den, 10);
    if (denominator === 0) return match;
    return String(parseFloat(whole) + parseInt(num, 10) / denominator);
  });

  // Step 3: Standalone ASCII fractions like "3/4" → "0.75"
  // Only convert denominators 2–16 (cooking-plausible fractions).
  // Avoid converting things like "2/14/2026" (dates) — require a non-digit boundary after.
  result = result.replace(/\b(\d+)\/(\d+)\b/g, (match, num, den) => {
    const denominator = parseInt(den, 10);
    if (denominator < 2 || denominator > 16) return match;
    const val = parseInt(num, 10) / denominator;
    return String(Math.round(val * 10000) / 10000);
  });

  // Step 4: Mangled patterns at the very start of the string.
  // These appear when the integer part of a Unicode fraction was stripped,
  // leaving just the denominator: "/2 cup" is a corrupted "½ cup".
  result = result.replace(/^\/2(\s|$)/, '0.5$1');
  result = result.replace(/^\/3(\s|$)/, '0.333$1');
  result = result.replace(/^\/4(\s|$)/, '0.25$1');
  result = result.replace(/^\/8(\s|$)/, '0.125$1');

  return result;
}

// ---------------------------------------------------------------------------
// cleanEncoding
// Replaces HTML entities, typographic punctuation, and invisible Unicode
// characters with plain ASCII equivalents.
// ---------------------------------------------------------------------------
export function cleanEncoding(str) {
  let result = str;

  // Apply the static replacement table
  for (const [from, to] of ENCODING_REPLACEMENTS) {
    // Use split/join instead of regex to avoid needing to escape every pattern
    result = result.split(from).join(to);
  }

  // Decode remaining numeric HTML entities: &#123; or &#x7B;
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  result = result.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCharCode(parseInt(dec, 10))
  );

  // Strip zero-width and invisible Unicode characters
  result = result.replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, '');

  // Strip other non-printable control characters (except newline/tab which
  // normalizeWhitespace handles)
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return result;
}

// ---------------------------------------------------------------------------
// normalizeWhitespace
// Collapses multi-character whitespace sequences to a single space and trims.
// ---------------------------------------------------------------------------
export function normalizeWhitespace(str) {
  return str
    .replace(/\r\n|\r/g, ' ')  // Windows / old Mac line endings → space
    .replace(/\t/g, ' ')        // tabs → space
    .replace(/\s{2,}/g, ' ')    // multiple spaces → single space
    .trim();
}

// ---------------------------------------------------------------------------
// isJunkLine
// Returns true if the string looks like a non-ingredient line that should be
// filtered out (section headers, instruction text, dividers, etc.).
// ---------------------------------------------------------------------------
export function isJunkLine(str) {
  const trimmed = (str || '').trim();

  // Too short to be a real ingredient
  if (trimmed.length < 2) return true;

  // Pure punctuation / symbols / digits with no letters
  if (/^[^a-zA-Z]+$/.test(trimmed)) return true;

  // Matches a known junk pattern
  if (JUNK_PATTERNS.some(re => re.test(trimmed))) return true;

  return false;
}

// ---------------------------------------------------------------------------
// preprocessOne  (internal)
// Runs a single ingredient string through all cleaning steps.
// ---------------------------------------------------------------------------
function preprocessOne(raw) {
  let result = String(raw || '');
  result = cleanEncoding(result);
  result = repairFractions(result);
  result = normalizeWhitespace(result);
  return result;
}

// ---------------------------------------------------------------------------
// preprocessIngredients  (primary export)
// Cleans a list of raw {name, source, ...} ingredient objects.
// Filters out junk entries. Returns a new array — does not mutate input.
// ---------------------------------------------------------------------------
export function preprocessIngredients(rawList) {
  if (!Array.isArray(rawList)) return [];

  return rawList
    .map(ing => {
      if (!ing || typeof ing !== 'object') return null;
      const cleaned = preprocessOne(ing.name || '');
      return { ...ing, name: cleaned };
    })
    .filter(ing => ing !== null && !isJunkLine(ing.name));
}
