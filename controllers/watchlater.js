import watchlater from "../Modals/watchlater.js";
import mongoose from "mongoose";

export const togglewatchlater = async (req, res) => {
  const { videoId } = req.params;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ message: "userId is required" });
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video ID" });
  }

  try {
    const existing = await watchlater.findOne({ viewer: userId, videoid: videoId });
    if (existing) {
      await watchlater.findByIdAndDelete(existing._id);
      return res.status(200).json({ watchlater: false });
    } else {
      await watchlater.create({ viewer: userId, videoid: videoId });
      return res.status(200).json({ watchlater: true });
    }
  } catch (error) {
    console.error("Toggle watch later error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getwatchlater = async (req, res) => {
  const { userId } = req.params;
  try {
    const watchlaterdata = await watchlater
      .find({ viewer: userId })
      .populate({ path: "videoid", model: "videofiles" })
      .sort({ createdAt: -1 });
    return res.status(200).json(watchlaterdata);
  } catch (error) {
    console.error("Get watch later error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
