/**
 * Recipe enrichment and inference utilities
 * Extracts and infers recipe properties from text
 */

/**
 * Parse ISO 8601 duration strings (e.g., "PT30M", "PT1H30M") into minutes
 * @param {string} isoDuration - ISO 8601 duration string
 * @returns {number|null} Duration in minutes, or null if parsing fails
 */
export function parseDurationToMinutes(isoDuration) {
  if (!isoDuration || typeof isoDuration !== 'string') {
    return null;
  }

  // ISO 8601 duration format: PT[n]H[n]M[n]S
  const regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
  const match = isoDuration.match(regex);

  if (!match) {
    return null;
  }

  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  return hours * 60 + minutes + (seconds > 0 ? 1 : 0); // Round up if seconds exist
}

/**
 * Infer protein type from recipe name and ingredients
 * @param {string} name - Recipe name
 * @param {string[]} ingredients - Array of ingredient strings
 * @returns {string} Protein type or empty string
 */
export function inferProteinType(name = '', ingredients = []) {
  const text = (name + ' ' + ingredients.join(' ')).toLowerCase();

  const proteinPatterns = {
    chicken: /\b(chicken|poultry)\b/,
    beef: /\b(beef|steak|ground beef|short rib)\b/,
    pork: /\b(pork|bacon|sausage|ham)\b/,
    seafood: /\b(shrimp|salmon|fish|tuna|cod|crab|lobster|seafood)\b/,
    turkey: /\bturkey\b/,
    lamb: /\blamb\b/,
    'plant-based': /\b(tofu|tempeh|chickpea|lentil|beans?)\b(?!.*green\s*bean)/,
    egg: /\b(egg|frittata|quiche|omelette|omelet)\b/,
  };

  // Check patterns in order of specificity
  for (const [proteinType, pattern] of Object.entries(proteinPatterns)) {
    if (pattern.test(text)) {
      return proteinType;
    }
  }

  return '';
}

/**
 * Infer cuisine style from recipe name, category, and ingredients
 * @param {string} name - Recipe name
 * @param {string} category - Recipe category
 * @param {string[]} ingredients - Array of ingredient strings
 * @returns {string} Cuisine style
 */
export function inferCuisineStyle(name = '', category = '', ingredients = []) {
  const text = (name + ' ' + category + ' ' + ingredients.join(' ')).toLowerCase();

  const cuisinePatterns = {
    Indian: /\b(tikka|masala|curry|naan|samosa|biryani|dal|roti)\b/,
    Mexican: /\b(taco|burrito|enchilada|salsa|tortilla|quesadilla|churro|cilantro|lime|jalapeño)\b/,
    Italian: /\b(pasta|risotto|bruschetta|parmesan|marinara|bolognese|carbonara|pesto|pizza)\b/,
    Asian: /\b(stir fry|stir-fry|teriyaki|ramen|dumpling|wonton|soy sauce|sesame)\b/,
    Korean: /\b(kimchi|bulgogi|bibimbap|gochujang|korean|rice bowl)\b/,
    Japanese: /\b(gyoza|miso|sushi|tempura|tonkatsu|udon)\b/,
    Thai: /\b(pad thai|curry paste|coconut milk|basil|thai|fish sauce)\b/,
    Mediterranean: /\b(hummus|falafel|shawarma|tzatziki|pita|greek|feta|olive)\b/,
    French: /\b(french|coq au vin|ratatouille|béarnaise|crème|beurre|sauté)\b/,
    Spanish: /\b(paella|tapas|churro|spanish|chorizo)\b/,
  };

  for (const [cuisine, pattern] of Object.entries(cuisinePatterns)) {
    if (pattern.test(text)) {
      return cuisine;
    }
  }

  return 'American';
}

/**
 * Infer meal type from recipe name and category
 * @param {string} name - Recipe name
 * @param {string} category - Recipe category
 * @returns {string} Meal type
 */
export function inferMealType(name = '', category = '') {
  const text = (name + ' ' + category).toLowerCase();

  const breakfastPattern =
    /\b(pancake|waffle|omelette|omelet|breakfast|muffin|granola|overnight oats|smoothie bowl|egg muffin|toast|cereal|brunch)\b/;
  const dessertPattern =
    /\b(cookie|cake|brownie|pie|pudding|fudge|truffle|ice cream|dessert|tart|cheesecake)\b/;
  const drinkPattern = /\b(smoothie|lemonade|margarita|cocktail|drink|juice|tea|coffee)\b/;
  const snackPattern =
    /\b(dip|salsa|tots|fries|side|appetizer|snack|roll|cracker|popcorn|chips)\b/;

  if (breakfastPattern.test(text)) return 'breakfast';
  if (dessertPattern.test(text)) return 'dessert';
  if (drinkPattern.test(text)) return 'drink';
  if (snackPattern.test(text)) return 'snack/side';

  return 'dinner';
}

/**
 * Extract structured data from JSON-LD schema
 * @param {object} schema - Parsed JSON-LD object
 * @returns {object|null} Extracted recipe data or null if not a recipe
 */
export function extractRecipeFromSchema(schema) {
  if (!schema) return null;

  // Handle @graph arrays
  let recipe = null;
  if (schema['@graph']) {
    for (const item of schema['@graph']) {
      if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
        recipe = item;
        break;
      }
    }
  } else if (schema['@type'] === 'Recipe' || (Array.isArray(schema['@type']) && schema['@type'].includes('Recipe'))) {
    recipe = schema;
  }

  if (!recipe) return null;

  return {
    name: recipe.name || '',
    ingredients: extractIngredients(recipe.recipeIngredient || []),
    cookTime: parseDurationToMinutes(recipe.cookTime) || 0,
    prepTime: parseDurationToMinutes(recipe.prepTime) || 0,
    totalTime: parseDurationToMinutes(recipe.totalTime) || 0,
    category: recipe.recipeCategory || '',
    cuisine: recipe.recipeCuisine || '',
    yield: recipe.recipeYield || '',
  };
}

/**
 * Extract ingredient array, handling various formats
 * @param {string[]|object[]} ingredients - Raw ingredients from schema
 * @returns {string[]} Cleaned ingredient strings
 */
function extractIngredients(ingredients) {
  if (!Array.isArray(ingredients)) {
    return [];
  }

  return ingredients
    .map((ingredient) => {
      if (typeof ingredient === 'string') {
        return ingredient.trim();
      }
      // Handle object format with text property
      if (typeof ingredient === 'object' && ingredient.text) {
        return ingredient.text.trim();
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Enrich recipe data with inferred properties
 * @param {object} recipe - Base recipe data
 * @param {string} source - Recipe source URL
 * @returns {object} Enriched recipe data
 */
export function enrichRecipe(recipe, source = '') {
  // Determine cook time (prefer total or cook time)
  const cookTime = recipe.totalTime || recipe.cookTime || 0;

  // Infer missing properties
  const proteinType = inferProteinType(recipe.name, recipe.ingredients);
  const cuisineStyle = recipe.cuisine || inferCuisineStyle(recipe.name, recipe.category, recipe.ingredients);
  const mealType = inferMealType(recipe.name, recipe.category);

  return {
    name: recipe.name || 'Unnamed Recipe',
    ingredients: recipe.ingredients || [],
    cook_time: cookTime,
    protein_type: proteinType,
    cuisine_style: cuisineStyle,
    meal_type: mealType,
    source: source,
  };
}
