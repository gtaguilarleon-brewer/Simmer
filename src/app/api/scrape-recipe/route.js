import { extractRecipeFromSchema, enrichRecipe } from '@/lib/recipeEnrichment';

/**
 * POST /api/scrape-recipe
 * Scrapes recipe data from a URL and extracts structured recipe information
 *
 * Request body:
 *   { url: "https://example.com/recipe" }
 *
 * Response:
 *   { success: true, recipe: { name, ingredients, cook_time, protein_type, cuisine_style, meal_type, source } }
 *   { success: false, error: "message" }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate input
    if (!url) {
      return Response.json(
        { success: false, error: 'Missing required field: url' },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return Response.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the URL with timeout and user-agent
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return Response.json(
        { success: false, error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Try to extract JSON-LD structured data
    let recipe = extractJsonLdRecipe(html);

    // If no JSON-LD found, try fallback extraction
    if (!recipe) {
      recipe = extractFromMeta(html, parsedUrl);
    }

    if (!recipe) {
      return Response.json(
        { success: false, error: 'No recipe data found on this page' },
        { status: 400 }
      );
    }

    // Enrich the recipe with inferred properties
    const enrichedRecipe = enrichRecipe(recipe, url);

    return Response.json(
      { success: true, recipe: enrichedRecipe },
      { status: 200 }
    );
  } catch (error) {
    console.error('Recipe scrape error:', error);

    // Handle specific error types
    if (error.name === 'AbortError') {
      return Response.json(
        { success: false, error: 'Request timeout: took longer than 10 seconds' },
        { status: 408 }
      );
    }

    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract recipe data from JSON-LD structured data in HTML
 * @param {string} html - HTML content
 * @returns {object|null} Extracted recipe data or null
 */
function extractJsonLdRecipe(html) {
  // Find all <script type="application/ld+json"> tags
  const jsonLdPattern = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const schema = JSON.parse(match[1]);
      const recipeData = extractRecipeFromSchema(schema);

      if (recipeData) {
        return recipeData;
      }
    } catch (e) {
      // Continue to next schema if parsing fails
      continue;
    }
  }

  return null;
}

/**
 * Fallback extraction from meta tags and page content
 * @param {string} html - HTML content
 * @param {URL} urlObj - Parsed URL object
 * @returns {object|null} Extracted recipe data or null
 */
function extractFromMeta(html, urlObj) {
  const recipe = {
    name: '',
    ingredients: [],
    cookTime: 0,
    category: '',
    cuisine: '',
  };

  // Extract title from <title> tag
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    recipe.name = titleMatch[1].trim().replace(/\s*[|/-].*$/, ''); // Remove trailing site info
  }

  // Try to extract from og:title
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
  if (ogTitleMatch) {
    recipe.name = ogTitleMatch[1];
  }

  // Try to extract from meta description or other common patterns
  const descriptionMatch = html.match(
    /<meta[^>]*name="description"[^>]*content="([^"]+)"/i
  );
  if (descriptionMatch && recipe.name) {
    // Use description for additional context if needed
  }

  // Simple heuristic: look for common ingredient patterns
  // This is a very basic fallback
  const ingredientPattern = /ingredients?[:\s]*<[^>]*>([^<]+)<\/[^>]*>/gi;
  let ingredientMatch;
  const extractedIngredients = new Set();

  while ((ingredientMatch = ingredientPattern.exec(html)) !== null) {
    const text = ingredientMatch[1].trim();
    if (text.length > 3 && text.length < 200) {
      extractedIngredients.add(text);
    }
  }

  recipe.ingredients = Array.from(extractedIngredients).slice(0, 20); // Limit to 20

  // If we found a name and some ingredients, return the recipe
  if (recipe.name || recipe.ingredients.length > 0) {
    return recipe;
  }

  return null;
}
