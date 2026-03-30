# Quick Start: Extract Recipe Photo API

## What Was Created

A Next.js 14 API route that accepts cookbook photos and returns a recipe template for manual entry.

## File Locations

- **API Route**: `/sessions/compassionate-kind-ritchie/mnt/outputs/simmer/src/app/api/extract-recipe-photo/route.js`
- **Configuration**: `/sessions/compassionate-kind-ritchie/mnt/outputs/simmer/next.config.js` (updated with notes)
- **Full Documentation**: `/sessions/compassionate-kind-ritchie/mnt/outputs/simmer/API_EXTRACT_RECIPE_PHOTO.md`

## Quick Test

```bash
cd /sessions/compassionate-kind-ritchie/mnt/outputs/simmer

# Start the dev server
npm run dev

# In another terminal, test with curl
curl -X POST http://localhost:3000/api/extract-recipe-photo \
  -F "image=@/path/to/image.jpg" \
  -F "cookbookName=Test Cookbook"
```

## Expected Response

```json
{
  "success": true,
  "recipe": {
    "name": "Recipe from Test Cookbook",
    "ingredients": [{"item": "", "quantity": "", "unit": ""}],
    "cook_time": null,
    "protein_type": null,
    "cuisine_style": null,
    "meal_type": null,
    "source": "cookbook: Test Cookbook"
  },
  "needsManualEntry": true,
  "message": "Image uploaded (45.32KB). OCR extraction not yet integrated..."
}
```

## Frontend Integration

```javascript
// 1. Handle file upload in a form
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('cookbookName', 'My Cookbook');

// 2. Send to API
const response = await fetch('/api/extract-recipe-photo', {
  method: 'POST',
  body: formData,
});

const data = await response.json();

// 3. Check if manual entry is needed (it always is for now)
if (data.needsManualEntry) {
  // Show recipe form in edit mode with pre-filled data
  setRecipe(data.recipe);
  showRecipeForm();
}
```

## Next Steps: Add OCR Integration

The route includes TODO comments with 5 OCR/AI service options:

1. **Tesseract.js** - Lightweight, client-side, no API key
2. **Google Cloud Vision** - Highly accurate, requires API key
3. **Claude API** - Intelligent recipe parsing, requires API key
4. **AWS Textract** - Enterprise-grade, requires AWS credentials
5. **Azure Computer Vision** - Multi-purpose, requires API key

See `API_EXTRACT_RECIPE_PHOTO.md` for detailed integration instructions for each option.

## Key Features

- FormData accepts image files and cookbook name
- Validates file type (must be image)
- Returns pre-filled recipe template with blank fields
- Sets `needsManualEntry: true` for UI mode detection
- Source field formatted as "cookbook: <name>"
- Handles file size validation
- Comprehensive error handling
- Ready for OCR service integration

## Configuration Notes

- Default payload limit: 4-5MB (suitable for most cookbook photos)
- next.config.js includes notes about increasing limits if needed
- No external dependencies required for current implementation
- Fully compatible with Next.js 14 App Router
