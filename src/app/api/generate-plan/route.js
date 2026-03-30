import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * POST /api/generate-plan
 * Generates a full weekly meal plan using Sonnet.
 *
 * Request body:
 *   {
 *     nights: { Monday: "normal", Tuesday: "not-home", ... },
 *     pickedRecipes: [{ name, protein, cuisine, mealType, time, night, recipeId, ingredients }],
 *     carryForwardRecipes: [{ name, protein, cuisine, mealType, time, recipeId }],
 *     easyMeals: [{ name, ingredients }],
 *     recipes: [{ id, name, protein_type, cuisine_style, meal_type, cook_time, times_made, source }],
 *   }
 *
 * Response:
 *   { success: true, plan: { Monday: [...], ..., "Batch Breakfast": [...], "Toddler Snacks": [...] } }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { nights, pickedRecipes, carryForwardRecipes, easyMeals, recipes } = body;

    if (!nights || !recipes) {
      return Response.json(
        { success: false, error: 'Missing required fields: nights, recipes' },
        { status: 400 }
      );
    }

    // Build context for the prompt
    const nightSummary = ALL_DAYS.map(d => `${d}: ${nights[d] || "normal"}`).join("\n");

    const pickedSummary = (pickedRecipes || []).length > 0
      ? (pickedRecipes || []).map(r => `- "${r.name}" (${r.protein || "unknown protein"}, ${r.cuisine || "unknown cuisine"}, ${r.time || "?"}min) -> assigned: ${r.night || "any night"}`).join("\n")
      : "None";

    const carryForwardSummary = (carryForwardRecipes || []).length > 0
      ? (carryForwardRecipes || []).map(r => `- "${r.name}" (${r.protein || "unknown protein"}, ${r.cuisine || "unknown cuisine"}, ${r.time || "?"}min)`).join("\n")
      : "None";

    const easyMealSummary = (easyMeals || []).length > 0
      ? (easyMeals || []).map(m => `- "${m.name}" (ingredients: ${m.ingredients || "not specified"})`).join("\n")
      : "None available";

    // Build a compact recipe library summary (top 80 by recency/variety)
    const libraryRecipes = (recipes || [])
      .filter(r => r.name)
      .map(r => ({
        id: r.id,
        name: r.name,
        protein: r.protein_type || "",
        cuisine: r.cuisine_style || "",
        mealType: r.meal_type || "",
        time: r.cook_time || null,
        timesMade: r.times_made || 0,
      }));

    const dinnerRecipes = libraryRecipes
      .filter(r => !r.mealType || r.mealType.toLowerCase() === "dinner")
      .slice(0, 60);

    const breakfastRecipes = libraryRecipes
      .filter(r => r.mealType && r.mealType.toLowerCase() === "breakfast")
      .slice(0, 15);

    const snackRecipes = libraryRecipes
      .filter(r => r.mealType && (r.mealType.toLowerCase() === "snack/side" || r.mealType.toLowerCase() === "snack"))
      .slice(0, 15);

    const librarySummary = dinnerRecipes.map(r =>
      `${r.id} | ${r.name} | ${r.protein} | ${r.cuisine} | ${r.mealType} | ${r.time || "?"}min | made ${r.timesMade}x`
    ).join("\n");

    const breakfastSummary = breakfastRecipes.map(r =>
      `${r.id} | ${r.name} | ${r.time || "?"}min | made ${r.timesMade}x`
    ).join("\n") || "No breakfast recipes in library";

    const snackSummary = snackRecipes.map(r =>
      `${r.id} | ${r.name} | ${r.time || "?"}min | made ${r.timesMade}x`
    ).join("\n") || "No snack recipes in library";

    const prompt = `You are a meal planning assistant for a family of two adults and a toddler. Generate a weekly meal plan.

CALENDAR (night contexts):
${nightSummary}

USER'S LOCKED-IN PICKS (these MUST be in the plan, on their assigned night or best-fit if "any night"):
${pickedSummary}

CARRIED FORWARD FROM LAST WEEK (these should be placed EARLY in the week, Monday/Tuesday preferred, since ingredients were already purchased):
${carryForwardSummary}

EASY MEALS LIST (use these for "just-me-out" / "one parent home" nights ONLY):
${easyMealSummary}

DINNER RECIPE LIBRARY (id | name | protein | cuisine | mealType | cookTime | timesMade):
${librarySummary}

BREAKFAST RECIPES:
${breakfastSummary}

SNACK RECIPES:
${snackSummary}

RULES:
1. "not-home" nights get NO meal assigned (empty array)
2. "just-me-out" nights MUST use an easy meal from the easy meals list, not the recipe library. Set isEasyMeal: true for these.
3. "busy" (quick) nights need recipes with cook time under 30 minutes
4. "normal" nights can use any recipe
5. Locked-in picks go on their assigned night. "Any night" picks go on the best remaining slot.
6. Carried-forward recipes go early in the week (Monday/Tuesday) on available normal or busy slots. Set isCarryForward: true for these.
7. No same protein on consecutive nights (soft constraint, best effort)
8. Mix cuisine styles across the week
9. Try to include one recipe with timesMade=0 (never tried) if available
10. Favor recipes with lower timesMade for variety
11. Generate 1-2 items for "Batch Breakfast" (prep-ahead, not last week's breakfast)
12. Generate 2-3 items for "Toddler Snacks" (kid-friendly, quick)
13. For EVERY meal, provide a short "reason" explaining why it was chosen

Respond with ONLY valid JSON, no markdown, no explanation. Use this exact structure:
{
  "Monday": [{ "name": "...", "recipeId": "uuid-or-null", "protein": "...", "cuisine": "...", "mealType": "dinner", "time": 30, "reason": "...", "isUserPick": false, "isCarryForward": false, "isEasyMeal": false, "easyMealIngredients": null }],
  "Tuesday": [...],
  "Wednesday": [...],
  "Thursday": [...],
  "Friday": [...],
  "Saturday": [...],
  "Sunday": [...],
  "Batch Breakfast": [{ "name": "...", "recipeId": "uuid-or-null", "protein": null, "cuisine": null, "mealType": "breakfast", "time": 15, "reason": "...", "isUserPick": false, "isCarryForward": false, "isEasyMeal": false, "easyMealIngredients": null }],
  "Toddler Snacks": [{ "name": "...", "recipeId": "uuid-or-null", "protein": null, "cuisine": null, "mealType": "snack", "time": 10, "reason": "...", "isUserPick": false, "isCarryForward": false, "isEasyMeal": false, "easyMealIngredients": null }]
}

For easy meals, set easyMealIngredients to the ingredients string from the easy meals list.
For locked-in picks, set isUserPick: true and reason: "Your pick".
For carried-forward meals, set isCarryForward: true and reason: "Carried forward from last week".
Use recipeId from the library when the recipe exists there. Use null for easy meals or recipes not in the library.
If a day is "not-home", return an empty array for that day.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract the text response
    const responseText = message.content
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("");

    // Parse JSON from response (handle potential markdown wrapping)
    let plan;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      plan = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      return Response.json(
        { success: false, error: 'Failed to parse AI response', raw: responseText },
        { status: 500 }
      );
    }

    // Validate the plan has expected sections
    const expectedSections = [...ALL_DAYS, "Batch Breakfast", "Toddler Snacks"];
    for (const section of expectedSections) {
      if (!plan[section]) plan[section] = [];
      // Ensure each entry has required fields
      plan[section] = plan[section].map(entry => ({
        name: entry.name || "Unnamed",
        recipeId: entry.recipeId || null,
        protein: entry.protein || null,
        cuisine: entry.cuisine || null,
        mealType: entry.mealType || "dinner",
        time: entry.time || null,
        reason: entry.reason || "",
        isUserPick: entry.isUserPick || false,
        isCarryForward: entry.isCarryForward || false,
        isEasyMeal: entry.isEasyMeal || false,
        easyMealIngredients: entry.easyMealIngredients || null,
      }));
    }

    return Response.json({ success: true, plan });

  } catch (error) {
    console.error('Generate plan error:', error);
    return Response.json(
      { success: false, error: error.message || 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}
