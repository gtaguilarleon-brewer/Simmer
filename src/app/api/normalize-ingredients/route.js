import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CHUNK_SIZE = 80; // Max ingredients per API call to stay within token limits

/**
 * POST /api/normalize-ingredients
 * Normalizes raw ingredient text into structured items using Haiku.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const ingredients = body?.ingredients;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return Response.json({ normalized: [] });
    }

    // Sanitize inputs: ensure name and source are strings
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

    // Chunk large ingredient lists
    const chunks = [];
    for (let i = 0; i < sanitized.length; i += CHUNK_SIZE) {
      chunks.push(sanitized.slice(i, i + CHUNK_SIZE));
    }

    let allNormalized = [];

    for (const chunk of chunks) {
      const ingredientLines = chunk.map((ing, i) =>
        `${i + 1}. "${ing.name}" (from: ${ing.source})`
      ).join("\n");

      const prompt = `You are an ingredient normalization assistant. Parse each raw ingredient string into structured data.

RAW INGREDIENTS:
${ingredientLines}

For each ingredient, extract:
- item: the canonical ingredient name in lowercase (e.g., "chicken thighs" not "2 lbs chicken thighs, bone-in")
- qty: numeric quantity (convert words to numbers: "two" = 2, "a dozen" = 12, "half" = 0.5). For ranges like "2-3", use the higher number. For "pinch", "drizzle", "to taste", use 0.
- unit: standardized unit abbreviation (lbs, oz, cups, tbsp, tsp, cloves, heads, bunch, can, pkg, each). Use "each" for whole items like "1 onion". Use "" for unitless items.
- qualifier: preparation notes like "bone-in", "diced", "minced", "frozen". Empty string if none.
- source: pass through the source field exactly as given
- raw: pass through the original ingredient text exactly as given

SPECIAL RULES:
1. Combined items like "salt and pepper to taste" should be split into separate entries.
2. Parenthetical alternates like "Greek yogurt (or sour cream)" should use the primary item only.
3. Unicode fractions: ½ = 0.5, ⅓ = 0.33, ¼ = 0.25, ¾ = 0.75, ⅔ = 0.67. Mixed numbers: 1½ = 1.5.
4. If no quantity is specified, use 1.
5. If it's clearly a pantry-type item with vague quantity ("pinch of salt", "oil for cooking"), set qty to 0 and unit to "".

Return ONLY a JSON array. No markdown, no explanation.

Example input: "1½ cups Greek yogurt (or sour cream)"
Example output: [{"item": "greek yogurt", "qty": 1.5, "unit": "cups", "qualifier": "", "source": "...", "raw": "..."}]`;

      try {
        const response = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        });

        const text = (response?.content?.[0]?.text) || "[]";

        // Parse the JSON response, handle potential markdown wrapping
        let cleaned = text.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }

        let parsed;
        try {
          parsed = JSON.parse(cleaned);
        } catch (parseErr) {
          console.error("Failed to parse Haiku response for chunk, using fallback:", parseErr.message);
          parsed = fallbackParse(chunk);
        }

        // Validate and normalize fields
        const validated = (Array.isArray(parsed) ? parsed : []).map(n => ({
          item: String(n.item || "").toLowerCase().trim(),
          qty: typeof n.qty === "number" ? n.qty : parseFloat(n.qty) || 1,
          unit: String(n.unit || "").toLowerCase().trim(),
          qualifier: String(n.qualifier || "").trim(),
          source: String(n.source || ""),
          raw: String(n.raw || ""),
        })).filter(n => n.item.length > 0);

        allNormalized = allNormalized.concat(validated);
      } catch (chunkErr) {
        console.error("Haiku API failed for chunk, using fallback:", chunkErr.message);
        allNormalized = allNormalized.concat(fallbackParse(chunk));
      }
    }

    return Response.json({ normalized: allNormalized });
  } catch (err) {
    console.error("Normalize ingredients error:", err);
    return Response.json({ error: err.message || "Normalization failed" }, { status: 500 });
  }
}

// Basic regex fallback when Haiku is unavailable
function fallbackParse(ingredients) {
  return ingredients.map(ing => {
    const raw = ing.name || "";
    // Try to extract leading quantity
    const qtyMatch = raw.match(/^([\d½⅓¼¾⅔]+(?:[.\d]*)?)\s*/);
    let qty = 1;
    let rest = raw;
    if (qtyMatch) {
      const qtyStr = qtyMatch[1]
        .replace("½", ".5").replace("⅓", ".33").replace("¼", ".25")
        .replace("¾", ".75").replace("⅔", ".67");
      qty = parseFloat(qtyStr) || 1;
      rest = raw.slice(qtyMatch[0].length);
    }
    // Try to extract unit
    const unitMatch = rest.match(/^(lbs?|oz|cups?|tbsp|tsp|cloves?|heads?|bunch|cans?|pkg|each)\s+/i);
    let unit = "";
    if (unitMatch) {
      unit = unitMatch[1].toLowerCase();
      rest = rest.slice(unitMatch[0].length);
    }
    // Remove trailing qualifiers after comma
    const parts = rest.split(",");
    const item = (parts[0] || "").trim().toLowerCase();
    const qualifier = (parts.slice(1).join(",") || "").trim();

    return { item, qty, unit, qualifier, source: ing.source, raw };
  }).filter(n => n.item.length > 0);
}
