import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "yourtube/videos",
    resource_type: "video",
    allowed_formats: ["mp4", "webm", "mov", "avi"],
    // Use original filename (sanitized) as public_id
    public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_").replace(/\.[^.]+$/, "")}`,
  }),
});

const filefilter = (req, file, cb) => {
  const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only video files (mp4, webm, mov, avi) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter: filefilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB (Cloudinary handles large files better)
});

export { cloudinary };
export default upload;
