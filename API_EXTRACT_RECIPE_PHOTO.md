# Extract Recipe Photo API Route

## Overview
The API route at `/api/extract-recipe-photo` accepts cookbook photos and returns a pre-filled recipe template for manual entry.

## Location
- **File**: `src/app/api/extract-recipe-photo/route.js`
- **Endpoint**: `POST /api/extract-recipe-photo`
- **Next.js Version**: 14 (App Router)

## Request Format

### POST Request
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]); // Image file
formData.append('cookbookName', 'Joy of Cooking'); // Optional

const response = await fetch('/api/extract-recipe-photo', {
  method: 'POST',
  body: formData,
});
```

### Request Parameters
- **image** (File, required): The cookbook photo to upload
- **cookbookName** (string, optional): Name of the cookbook. Defaults to 'Unknown Cookbook'

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "recipe": {
    "name": "Recipe from Joy of Cooking",
    "ingredients": [
      {
        "item": "",
        "quantity": "",
        "unit": ""
      }
    ],
    "cook_time": null,
    "protein_type": null,
    "cuisine_style": null,
    "meal_type": null,
    "source": "cookbook: Joy of Cooking"
  },
  "needsManualEntry": true,
  "message": "Image uploaded (45.32KB). OCR extraction not yet integrated. Please fill in the recipe details manually...",
  "imageReceived": {
    "filename": "recipe.jpg",
    "type": "image/jpeg",
    "size": 46408
  }
}
```

### Error Response (400/500)
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Features

### Current Implementation
1. ✅ Accepts POST requests with FormData containing an image file
2. ✅ Validates file type (must be an image)
3. ✅ Returns pre-filled recipe template with blank fields
4. ✅ Sets `needsManualEntry: true` for UI to show form in edit mode
5. ✅ Formats `source` field as "cookbook: <cookbookName>"
6. ✅ Logs file information for debugging
7. ✅ Comprehensive error handling

### Future Integration (OCR/AI Services)

The route includes detailed TODO comments for integrating OCR/AI services:

#### Option 1: Tesseract.js (Lightweight, Client-Side)
```bash
npm install tesseract.js
```
- No API key required
- Extract text on client, send to server for parsing
- Smaller initial payload

#### Option 2: Google Cloud Vision API (Highly Accurate)
Requires: `GOOGLE_CLOUD_VISION_API_KEY` in `.env`
- Server-side OCR processing
- Excellent accuracy for recipe text
- Handles multiple languages

#### Option 3: Claude API with Vision (Intelligent Parsing)
Requires: `ANTHROPIC_API_KEY` in `.env`
- Can intelligently extract and parse recipe structure
- Understands recipe components automatically
- Best for converting images directly to structured data

#### Option 4: AWS Textract (Enterprise)
- AWS credentials required
- High accuracy, handles complex layouts
- Good for batch processing

#### Option 5: Azure Computer Vision (Multi-Purpose)
Requires: `AZURE_VISION_KEY` and `AZURE_VISION_ENDPOINT` in `.env`
- General-purpose image analysis
- Can extract text and object detection

## File Size Limits

### Default Configuration
- Next.js App Router supports request bodies up to **4-5MB** by default
- Most standard cookbook photos (2-5MB) work without configuration

### For Larger Uploads
If you encounter 413 Payload Too Large errors:

1. **Compress images on the client side** (Recommended)
   ```javascript
   // Use browser's Canvas API or a library like sharp
   const canvas = await html2canvas(imageElement);
   const compressedBlob = await canvas.convertToBlob({ quality: 0.7 });
   ```

2. **Configure hosting platform** (Vercel, AWS, etc.)
   - Vercel: Max 4.5MB by default, configurable in project settings
   - AWS Lambda: Increase payload size in function configuration
   - Self-hosted: Configure Node.js server limits

3. **Implement chunked uploads**
   - For files > 10MB, consider multipart uploads
   - Libraries: `uppy`, `dropzone.js`

## Configuration in next.config.js

The `next.config.js` includes a note about payload limits. Current configuration:

```javascript
const nextConfig = {
  // Note: For file uploads larger than 4-5MB, you may need to configure
  // your hosting platform (Vercel, AWS, etc.) for larger payloads.
};
```

## Error Handling

The API handles the following error cases:

| Error | Status | Message |
|-------|--------|---------|
| No image file provided | 400 | "No image file provided. Please upload a cookbook photo." |
| Invalid file type | 400 | "Invalid file type. Please upload an image file." |
| Server error | 500 | "Failed to process image: {error details}" |

## Environment Variables

Current implementation: **None required** (all dependencies are built-in)

Future implementations will require:
- **Tesseract.js**: None (client-side)
- **Google Vision**: `GOOGLE_CLOUD_VISION_API_KEY`
- **Claude API**: `ANTHROPIC_API_KEY`
- **AWS Textract**: AWS credentials (typically via environment)
- **Azure Vision**: `AZURE_VISION_KEY`, `AZURE_VISION_ENDPOINT`

## Frontend Usage Example

```javascript
// In a React component
const handlePhotoUpload = async (event) => {
  const file = event.target.files[0];
  const cookbookName = 'My Cookbook';

  const formData = new FormData();
  formData.append('image', file);
  formData.append('cookbookName', cookbookName);

  try {
    const response = await fetch('/api/extract-recipe-photo', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      // data.recipe contains the pre-filled template
      // data.needsManualEntry is true, so show form in edit mode
      setRecipe(data.recipe);
      setShowRecipeForm(true);
    } else {
      console.error('Upload failed:', data.error);
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
};
```

## Testing

### Using curl
```bash
curl -X POST http://localhost:3000/api/extract-recipe-photo \
  -F "image=@/path/to/recipe.jpg" \
  -F "cookbookName=Joy of Cooking"
```

### Using JavaScript fetch
```javascript
const formData = new FormData();
formData.append('image', document.querySelector('input[type="file"]').files[0]);
formData.append('cookbookName', 'Test Cookbook');

fetch('/api/extract-recipe-photo', {
  method: 'POST',
  body: formData,
})
.then(res => res.json())
.then(data => console.log(data));
```

## Notes

1. **needsManualEntry**: Always set to `true` until OCR integration is complete. The frontend should use this flag to display the recipe form in edit mode.

2. **Source Format**: The `source` field uses the format `"cookbook: <cookbookName>"` as specified. This distinguishes cookbook recipes from web scrapes.

3. **Ingredients Array**: Includes one empty ingredient object as a template. The frontend can add more as needed.

4. **All Fields Nullable**: Except `name` and `source`, all other fields start as `null` to indicate they need manual entry.

5. **Image Validation**: Only image MIME types are accepted. Ensure frontend validates file type before upload.
