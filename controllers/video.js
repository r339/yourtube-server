import video from "../Modals/video.js";
import { cloudinary } from "../filehelper/filehelper.js";
import mongoose from "mongoose";

export const uploadvideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a valid video file (mp4, webm, mov, avi)" });
  }
  try {
    const file = new video({
      videotitle: req.body.videotitle,
      filename: req.file.originalname,
      filepath: req.file.path,               // Cloudinary secure_url
      filetype: req.file.mimetype,
      filesize: String(req.file.size),
      cloudinary_public_id: req.file.filename, // Cloudinary public_id
      videochanel: req.body.videochanel,
      uploader: req.body.uploader,
    });
    await file.save();
    return res.status(201).json({ message: "File uploaded successfully", video: file });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallvideo = async (req, res) => {
  try {
    const files = await video.find().sort({ createdAt: -1 });
    return res.status(200).json(files);
  } catch (error) {
    console.error("Get all videos error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getvideosbyuploader = async (req, res) => {
  const { uploaderId } = req.params;
  try {
    const files = await video.find({ uploader: uploaderId }).sort({ createdAt: -1 });
    return res.status(200).json(files);
  } catch (error) {
    console.error("Get uploader videos error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const searchvideos = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Query is required" });
  try {
    const results = await video.find({
      $or: [
        { videotitle: { $regex: q, $options: "i" } },
        { videochanel: { $regex: q, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });
    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletevideo = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid video ID" });
  }
  try {
    const found = await video.findById(id);
    if (!found) return res.status(404).json({ message: "Video not found" });

    // Delete from Cloudinary
    if (found.cloudinary_public_id) {
      await cloudinary.uploader.destroy(found.cloudinary_public_id, { resource_type: "video" });
    }

    await video.findByIdAndDelete(id);
    return res.status(200).json({ message: "Video deleted" });
  } catch (error) {
    console.error("Delete video error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
