import video from "../Modals/video.js";
import like from "../Modals/like.js";
import mongoose from "mongoose";

export const handlelike = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;

  if (!userId) return res.status(400).json({ message: "userId is required" });
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video ID" });
  }

  try {
    const existinglike = await like.findOne({ viewer: userId, videoid: videoId });
    if (existinglike) {
      await like.findByIdAndDelete(existinglike._id);
      await video.findByIdAndUpdate(videoId, { $inc: { Like: -1 } });
      return res.status(200).json({ liked: false });
    } else {
      await like.create({ viewer: userId, videoid: videoId });
      await video.findByIdAndUpdate(videoId, { $inc: { Like: 1 } });
      return res.status(200).json({ liked: true });
    }
  } catch (error) {
    console.error("Like error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallLikedVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    const likevideos = await like
      .find({ viewer: userId })
      .populate({ path: "videoid", model: "videofiles" })
      .sort({ createdAt: -1 });
    return res.status(200).json(likevideos);
  } catch (error) {
    console.error("Get liked videos error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
