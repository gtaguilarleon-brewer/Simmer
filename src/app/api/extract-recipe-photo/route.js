import { NextResponse } from 'next/server';
import { enrichRecipe } from '@/lib/recipeEnrichment';

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

    const buffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mediaType = imageFile.type || 'image/jpeg';

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
                text: 'Extract the recipe from this cookbook photo. Return ONLY valid JSON with no other text, using this exact format:\n{\n  "name": "Recipe Name",\n  "ingredients": ["ingredient 1", "ingredient 2"],\n  "cook_time_minutes": 30,\n  "category": "Dinner"\n}\n\nRules:\n- "ingredients" must be an array of strings, each in the format "amount unit ingredient" (e.g., "1 cup flour", "2 tbsp olive oil")\n- "cook_time_minutes" should be total cook time as a number in minutes, or null if not visible\n- "category" should be one of: Breakfast, Dinner, Dessert, Snack/Side, Drink (use Title Case)\n- If you cannot read part of the recipe clearly, include what you can and use "?" for unclear parts\n- If the image does not contain a recipe, return: {"name": "", "ingredients": [], "cook_time_minutes": null, "category": "Dinner", "not_a_recipe": true}',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
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

    let parsed;
    try {
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

    const baseRecipe = {
      name: parsed.name || '',
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      cookTime: parsed.cook_time_minutes || 0,
      totalTime: parsed.cook_time_minutes || 0,
      category: parsed.category || '',
      cuisine: '',
    };

    const enriched = enrichRecipe(baseRecipe, `cookbook: ${cookbookName}`);

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
