import mongoose from "mongoose";

const videochema = mongoose.Schema(
  {
    videotitle: { type: String, required: true },
    filename: { type: String, required: true },
    filepath: { type: String, required: true },   // Cloudinary secure URL
    filetype: { type: String, required: true },
    filesize: { type: String, required: true },
    cloudinary_public_id: { type: String },        // For deletion via Cloudinary API
    videochanel: { type: String, required: true },
    Like: { type: Number, default: 0 },
    Dislike: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    uploader: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("videofiles", videochema);
