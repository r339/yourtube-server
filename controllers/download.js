import download from "../Modals/download.js";
import user from "../Modals/Auth.js";

export const trackdownload = async (req, res) => {
  const { userid, videoid, videoTitle, videoUrl } = req.body;
  if (!userid || !videoid) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const userData = await user.findById(userid);
    if (!userData) return res.status(404).json({ message: "User not found" });

    const today = new Date().toDateString();
    const lastDate = userData.lastDownloadDate
      ? new Date(userData.lastDownloadDate).toDateString()
      : null;

    // Reset daily count if it's a new day
    if (lastDate !== today) {
      userData.downloadsToday = 0;
      userData.lastDownloadDate = new Date();
    }

    const plan = userData.plan || "free";
    // Free users: 1 download/day; premium/bronze/silver/gold: unlimited
    if (plan === "free" && userData.downloadsToday >= 1) {
      return res.status(403).json({
        message:
          "Free users can only download 1 video per day. Upgrade to premium for unlimited downloads.",
        canDownload: false,
      });
    }

    userData.downloadsToday = (userData.downloadsToday || 0) + 1;
    userData.lastDownloadDate = new Date();
    await userData.save();

    const newDownload = new download({ userid, videoid, videoTitle, videoUrl });
    await newDownload.save();

    return res.status(200).json({ canDownload: true, data: newDownload });
  } catch (error) {
    console.error("Track download error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getuserdownloads = async (req, res) => {
  const { userId } = req.params;
  try {
    const downloads = await download
      .find({ userid: userId })
      .sort({ downloadedAt: -1 });
    return res.status(200).json(downloads);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
