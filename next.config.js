/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: For file uploads larger than 4-5MB, you may need to configure
  // your hosting platform (Vercel, AWS, etc.) for larger payloads.
  // The API route at /api/extract-recipe-photo handles cookbook photos.
  // See that route's comments for more configuration details.
};

module.exports = nextConfig;
