const cloudinary = require('cloudinary').v2;

// Prefer CLOUDINARY_URL (recommended by Cloudinary dashboard), but
// also support explicit CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET.
if (process.env.CLOUDINARY_URL) {
  // CLOUDINARY_URL already contains cloud name, key and secret.
  cloudinary.config({ secure: true });
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn(
    '⚠️ Cloudinary is not fully configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.'
  );
}

module.exports = cloudinary;
