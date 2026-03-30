import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * POST /api/regenerate-slot
 * Regenerates a single meal slot in the plan using Sonnet.
 *
 * Request body:
 *   {
 *     section: "Wednesday",
 *     currentMealName: "Chicken Tikka Masala",
 *     nightContext: "normal",
 *     currentPlan: { Monday: [...], Tuesday: [...], ... },
 *     recipes: [{ id, name, protein_type, cuisine_style, meal_type, cook_time, times_made }],
 *     easyMeals: [{ name, ingredients }]  // only needed if nightContext is "just-me-out"
 *   }
 *
 * Response:
 *   { success: true, meal: { name, recipeId, protein, cuisine, mealType, time, reason, ... } }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { section, currentMealName, nightContext, currentPlan, recipes, easyMeals } = body;

    if (!section || !currentPlan || !recipes) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const isExtraSection = section === "Batch Breakfast" || section === "Toddler Snacks";
    const isEasyMealSlot = nightContext === "just-me-out";

    // Build summary of what's already in the plan (to avoid duplicates)
    const currentMeals = Object.entries(currentPlan)
      .flatMap(([day, meals]) => (meals || []).map(m => `${day}: ${m.name}`))
      .join("\n");

    // Build relevant recipe subset
    let recipeSummary;
    if (isEasyMealSlot) {
      recipeSummary = (easyMeals || []).map(m => `- "${m.name}" (ingredients: ${m.ingredients || "not specified"})`).join("\n") || "No easy meals available";
    } else if (section === "Batch Breakfast") {
      recipeSummary = (recipes || [])
        .filter(r => r.meal_type && r.meal_type.toLowerCase() === "breakfast")
        .slice(0, 20)
        .map(r => `${r.id} | ${r.name} | ${r.cook_time || "?"}min | made ${r.times_made || 0}x`)
        .join("\n") || "No breakfast recipes available";
    } else if (section === "Toddler Snacks") {
      recipeSummary = (recipes || [])
        .filter(r => r.meal_type && (r.meal_type.toLowerCase() === "snack/side" || r.meal_type.toLowerCase() === "snack"))
        .slice(0, 20)
        .map(r => `${r.id} | ${r.name} | ${r.cook_time || "?"}min | made ${r.times_made || 0}x`)
        .join("\n") || "No snack recipes available";
    } else {
      recipeSummary = (recipes || [])
        .filter(r => !r.meal_type || r.meal_type.toLowerCase() === "dinner")
        .slice(0, 50)
        .map(r => `${r.id} | ${r.name} | ${r.protein_type || ""} | ${r.cuisine_style || ""} | ${r.cook_time || "?"}min | made ${r.times_made || 0}x`)
        .join("\n");
    }

    const timeConstraint = nightContext === "busy" ? "MUST be under 30 minutes cook time." : "";

    const prompt = `You are a meal planning assistant. I need ONE replacement meal for ${section}.

CURRENT MEAL BEING REPLACED: "${currentMealName || "empty slot"}"
NIGHT CONTEXT: ${nightContext || "normal"} ${timeConstraint}
${isEasyMealSlot ? "This is a 'one parent home' night. Pick from the EASY MEALS LIST only." : ""}

CURRENT PLAN (avoid duplicates):
${currentMeals}

${isEasyMealSlot ? "EASY MEALS LIST:" : "AVAILABLE RECIPES (id | name | protein | cuisine | cookTime | timesMade):"}
${recipeSummary}

Pick ONE meal that:
- Is NOT "${currentMealName}"
- Is NOT already in the current plan
- Fits the night context constraints
- Provides good variety with the rest of the week

Respond with ONLY valid JSON, no markdown:
{
  "name": "...",
  "recipeId": "uuid-or-null",
  "protein": "...",
  "cuisine": "...",
  "mealType": "${isExtraSection ? (section === "Batch Breakfast" ? "breakfast" : "snack") : "dinner"}",
  "time": 30,
  "reason": "short explanation of why this was chosen",
  "isUserPick": false,
  "isCarryForward": false,
  "isEasyMeal": ${isEasyMealSlot},
  "easyMealIngredients": ${isEasyMealSlot ? '"comma-separated list of ingredients needed for this easy meal"' : 'null'}
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("");

    let meal;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      meal = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      return Response.json(
        { success: false, error: 'Failed to parse AI response', raw: responseText },
        { status: 500 }
      );
    }

    // Normalize the response
    meal = {
      name: meal.name || "Unnamed",
      recipeId: meal.recipeId || null,
      protein: meal.protein || null,
      cuisine: meal.cuisine || null,
      mealType: meal.mealType || "dinner",
      time: meal.time || null,
      reason: meal.reason || "Regenerated",
      isUserPick: false,
      isCarryForward: false,
      isEasyMeal: meal.isEasyMeal || false,
      easyMealIngredients: meal.easyMealIngredients || null,
    };

    return Response.json({ success: true, meal });

  } catch (error) {
    console.error('Regenerate slot error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to regenerate meal' },
      { status: 500 }
    );
  }
}
