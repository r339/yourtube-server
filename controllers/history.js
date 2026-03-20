import video from "../Modals/video.js";
import history from "../Modals/history.js";
import mongoose from "mongoose";

export const addtohistory = async (req, res) => {
  const { videoId } = req.params;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ message: "userId is required" });
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video ID" });
  }

  try {
    // Increment view count
    await video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    // Remove existing history entry to avoid duplicates
    await history.deleteOne({ viewer: userId, videoid: videoId });
    // Add fresh history entry at top
    await history.create({ viewer: userId, videoid: videoId });
    return res.status(200).json({ history: true });
  } catch (error) {
    console.error("Add to history error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const incrementviews = async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video ID" });
  }
  try {
    await video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    return res.status(200).json({ views: true });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const gethistory = async (req, res) => {
  const { userId } = req.params;
  try {
    const historydata = await history
      .find({ viewer: userId })
      .populate({ path: "videoid", model: "videofiles" })
      .sort({ createdAt: -1 });
    return res.status(200).json(historydata);
  } catch (error) {
    console.error("Get history error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const removefromhistory = async (req, res) => {
  const { historyId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(historyId)) {
    return res.status(400).json({ message: "Invalid history ID" });
  }
  try {
    await history.findByIdAndDelete(historyId);
    return res.status(200).json({ removed: true });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
