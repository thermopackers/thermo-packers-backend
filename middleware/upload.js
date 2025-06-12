import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
   params: async (req, file) => ({
    folder: 'assets',
    resource_type: 'auto', // ✅ auto-detects images or pdfs
    public_id: `${Date.now()}-${file.originalname}`, // Optional: more control over naming
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'], // ✅ allow pdf
  }),
});

const upload = multer({ storage });

export default upload;
