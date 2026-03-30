import { NextResponse } from 'next/server';
import { enrichRecipe } from '@/lib/recipeEnrichment';

/**
 * POST /api/extract-recipe-photo
 *
 * Accepts a cookbook photo and extracts recipe data using Claude Vision.
 * Sends the image to Claude's API, which reads the text and returns
 * structured recipe fields in one pass.
 *
 * Request body (FormData):
 * - image: File (required) - The cookbook photo
 * - cookbookName: string (optional) - Name of the cookbook
 *
 * Response:
 * {
 *   success: true,
 *   recipe: { name, ingredients, cook_time, protein_type, cuisine_style, meal_type, source },
 *   needsManualEntry: boolean
 * }
 */

export async function POST(request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const cookbookName = formData.get('cookbookName') || 'Unknown Cookbook';

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No image file provided. Please upload a cookbook photo.' },
        { status: 400 }
      );
    }

    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload an image file.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback to manual entry if no API key configured
      return NextResponse.json({
        success: true,
        recipe: {
          name: '',
          ingredients: [],
          cook_time: null,
          protein_type: '',
          cuisine_style: '',
          meal_type: '',
          source: `cookbook: ${cookbookName}`,
        },
        needsManualEntry: true,
        message: 'No ANTHROPIC_API_KEY configured. Please fill in recipe details manually.',
      });
    }

    // Convert image to base64
    const buffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    // Determine media type
    const mediaType = imageFile.type || 'image/jpeg';

    // Call Claude Vision API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `Extract the recipe from this cookbook photo. Return ONLY valid JSON with no other text, using this exact format:
{
  "name": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "cook_time_minutes": 30,
  "category": "dinner"
}

Rules:
- "ingredients" must be an array of strings, each in the format "amount unit ingredient" (e.g., "1 cup flour", "2 tbsp olive oil")
- "cook_time_minutes" should be total cook time as a number in minutes, or null if not visible
- "category" should be one of: breakfast, dinner, dessert, snack/side, drink
- If you cannot read part of the recipe clearly, include what you can and use "?" for unclear parts
- If the image does not contain a recipe, return: {"name": "", "ingredients": [], "cook_time_minutes": null, "category": "dinner", "not_a_recipe": true}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      // Fallback to manual entry on API error
      return NextResponse.json({
        success: true,
        recipe: {
          name: '',
          ingredients: [],
          cook_time: null,
          protein_type: '',
          cuisine_style: '',
          meal_type: '',
          source: `cookbook: ${cookbookName}`,
        },
        needsManualEntry: true,
        message: 'Could not process image. Please fill in recipe details manually.',
      });
    }

    const result = await response.json();
    const textContent = result.content?.find((c) => c.type === 'text')?.text || '';

    // Parse the JSON from Claude's response
    let parsed;
    try {
      // Extract JSON from response (handles cases where Claude wraps in markdown code blocks)
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('Failed to parse Claude response:', textContent);
      return NextResponse.json({
        success: true,
        recipe: {
          name: '',
          ingredients: [],
          cook_time: null,
          protein_type: '',
          cuisine_style: '',
          meal_type: '',
          source: `cookbook: ${cookbookName}`,
        },
        needsManualEntry: true,
        message: 'Could not parse recipe from image. Please fill in details manually.',
      });
    }

    // Check if Claude determined this isn't a recipe
    if (parsed.not_a_recipe) {
      return NextResponse.json({
        success: true,
        recipe: {
          name: '',
          ingredients: [],
          cook_time: null,
          protein_type: '',
          cuisine_style: '',
          meal_type: '',
          source: `cookbook: ${cookbookName}`,
        },
        needsManualEntry: true,
        message: 'This image does not appear to contain a recipe. Please fill in details manually.',
      });
    }

    // Build base recipe from Claude's extraction
    const baseRecipe = {
      name: parsed.name || '',
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      cookTime: parsed.cook_time_minutes || 0,
      totalTime: parsed.cook_time_minutes || 0,
      category: parsed.category || '',
      cuisine: '',
    };

    // Use enrichRecipe to infer protein_type, cuisine_style, meal_type
    const enriched = enrichRecipe(baseRecipe, `cookbook: ${cookbookName}`);

    // Override meal_type with Claude's category if provided (it sees the actual recipe)
    if (parsed.category) {
      enriched.meal_type = parsed.category;
    }

    const hasName = enriched.name && enriched.name.length > 0;
    const hasIngredients = enriched.ingredients && enriched.ingredients.length > 0;

    return NextResponse.json({
      success: true,
      recipe: enriched,
      needsManualEntry: !hasName || !hasIngredients,
      message: hasName && hasIngredients
        ? 'Recipe extracted successfully. Please review before saving.'
        : 'Partial extraction. Please review and fill in missing details.',
    });
  } catch (error) {
    console.error('Error in extract-recipe-photo:', error);
    return NextResponse.json(
      { success: false, error: `Failed to process image: ${error.message}` },
      { status: 500 }
    );
  }
}
