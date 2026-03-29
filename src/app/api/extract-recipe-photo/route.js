import { NextResponse } from 'next/server';

/**
 * POST /api/extract-recipe-photo
 *
 * Accepts a cookbook photo and extracts recipe data from it.
 * Since OCR/AI services require external API keys, this route:
 * 1. Accepts the image file via FormData
 * 2. Returns a pre-filled recipe template
 * 3. Marks the recipe as needing manual entry/verification
 *
 * Request body (FormData):
 * - image: File (required) - The cookbook photo
 * - cookbookName: string (optional) - Name of the cookbook
 *
 * Response:
 * {
 *   success: true,
 *   recipe: {
 *     name: string,
 *     ingredients: [],
 *     cook_time: null,
 *     protein_type: null,
 *     cuisine_style: null,
 *     meal_type: null,
 *     source: string (format: "cookbook: <cookbookName>")
 *   },
 *   needsManualEntry: true,
 *   message: string
 * }
 */

export async function POST(request) {
  try {
    // Parse the FormData from the request
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const cookbookName = formData.get('cookbookName') || 'Unknown Cookbook';

    // Validate that an image was provided
    if (!imageFile) {
      return NextResponse.json(
        {
          success: false,
          error: 'No image file provided. Please upload a cookbook photo.',
        },
        { status: 400 }
      );
    }

    // Validate file is an image
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Please upload an image file.',
        },
        { status: 400 }
      );
    }

    // TODO: Integrate OCR/AI service for text extraction
    // Options to consider:
    // 1. Tesseract.js - Client-side OCR (lightweight, no API key needed)
    //    - npm install tesseract.js
    //    - Extract text from image and pass to this route
    // 2. Google Cloud Vision API - Highly accurate server-side OCR
    //    - Requires: GOOGLE_CLOUD_VISION_API_KEY in .env
    //    - See: https://cloud.google.com/vision/docs/setup
    // 3. Claude API with vision - Intelligent recipe parsing
    //    - Requires: ANTHROPIC_API_KEY in .env
    //    - const response = await fetch('https://api.anthropic.com/v1/messages', {
    //        model: 'claude-3-5-sonnet-20241022',
    //        messages: [{
    //          role: 'user',
    //          content: [
    //            {
    //              type: 'image',
    //              source: { type: 'base64', media_type: 'image/jpeg', data: base64Image }
    //            },
    //            {
    //              type: 'text',
    //              text: 'Extract recipe data: name, ingredients, cook time, protein type, cuisine style, meal type'
    //            }
    //          ]
    //        }]
    //      });
    // 4. AWS Textract - Enterprise-grade OCR
    //    - Requires: AWS credentials configured
    // 5. Azure Computer Vision - Multi-purpose image analysis
    //    - Requires: AZURE_VISION_KEY and AZURE_VISION_ENDPOINT in .env

    // For now, read the file to get size info (validates file was received)
    const buffer = await imageFile.arrayBuffer();
    const fileSizeKB = buffer.byteLength / 1024;

    // Log file info for debugging (in production, consider removing)
    console.log(`Image received: ${imageFile.name} (${fileSizeKB.toFixed(2)}KB)`);

    // Return a pre-filled recipe template
    // The frontend should set needsManualEntry: true to show the form in edit mode
    const recipeTemplate = {
      name: '',
      ingredients: [],
      cook_time: null,
      protein_type: '',
      cuisine_style: '',
      meal_type: '',
      source: `cookbook: ${cookbookName}`,
    };

    return NextResponse.json(
      {
        success: true,
        recipe: recipeTemplate,
        needsManualEntry: true,
        message: `Image uploaded (${fileSizeKB.toFixed(2)}KB). OCR extraction not yet integrated. Please fill in the recipe details manually, or configure an OCR service in your environment.`,
        imageReceived: {
          filename: imageFile.name,
          type: imageFile.type,
          size: buffer.byteLength,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in extract-recipe-photo:', error);

    return NextResponse.json(
      {
        success: false,
        error: `Failed to process image: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

/**
 * Configuration note for next.config.js:
 *
 * By default, Next.js App Router supports request bodies up to 4MB.
 * For larger image uploads, configure in next.config.js:
 *
 * ```javascript
 * const nextConfig = {
 *   api: {
 *     bodyParser: {
 *       sizeLimit: '10mb', // Increase from default 1mb
 *     },
 *   },
 * };
 *
 * module.exports = nextConfig;
 * ```
 *
 * However, for App Router (not Pages Router), Next.js handles this differently.
 * The App Router doesn't use bodyParser config. Instead, large payloads are
 * handled by the underlying Node.js server.
 *
 * If you need to increase payload limits for the entire app:
 * ```javascript
 * const nextConfig = {
 *   // For App Router, increase server timeout if processing large images
 *   serverRuntimeConfig: {
 *     // Server-only runtime config
 *   },
 * };
 * ```
 *
 * Most image uploads under 5MB should work without configuration.
 * If you encounter 413 Payload Too Large errors, you may need to:
 * 1. Increase the image compression on the client side
 * 2. Configure your hosting platform (Vercel, AWS, etc.) for larger payloads
 * 3. Implement streaming uploads for very large files
 */
