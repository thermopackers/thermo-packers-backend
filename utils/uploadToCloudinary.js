import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path"; // ✅ FIXED: Use Node's path module

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a local file to Cloudinary under the 'slips' folder.
 * @param {string} localPath - Absolute or relative path to the local file.
 * @param {string} folder - Optional Cloudinary folder name (default: 'slips').
 * @returns {string} - Public secure URL to the uploaded file.
 */
export const uploadSlipToCloudinary = async (localPath, folder = "slips") => {
  try {
    const fileName = path.basename(localPath, path.extname(localPath)); // remove extension

    const result = await cloudinary.uploader.upload(localPath, {
      resource_type: "raw", // for PDFs
      folder,
        public_id: fileName, // ensures .pdf is preserved in the final URL
    });

    fs.unlinkSync(localPath); // ✅ Delete local file after upload

    return result.secure_url;
  } catch (err) {
    console.error("❌ Cloudinary upload error:", err);
    throw err;
  }
};
