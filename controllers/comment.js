import comment from "../Modals/comment.js";
import mongoose from "mongoose";

// Regex: block comments with special chars (<, >, {, }, [, ], \, |, ^, `, ~)
const SPECIAL_CHAR_REGEX = /[<>{}\[\]\\|^`~]/;

export const postcomment = async (req, res) => {
  const { videoid, userid, commentbody, usercommented, city } = req.body;
  if (!videoid || !userid || !commentbody) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Block special characters
  if (SPECIAL_CHAR_REGEX.test(commentbody)) {
    return res.status(400).json({
      message: "Comments cannot contain special characters like <, >, {, }, [, ], \\, |, ^, ` or ~",
      blocked: true,
    });
  }

  try {
    const newComment = new comment({
      videoid,
      userid,
      commentbody,
      usercommented,
      city: city || "Unknown",
    });
    await newComment.save();
    return res.status(200).json({ comment: true, data: newComment });
  } catch (error) {
    console.error("Post comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const comments = await comment.find({ videoid }).sort({ commentedon: -1 });
    return res.status(200).json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Comment not found" });
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Comment not found" });
  }
  // Block special characters in edits too
  if (SPECIAL_CHAR_REGEX.test(commentbody)) {
    return res.status(400).json({
      message: "Comments cannot contain special characters",
      blocked: true,
    });
  }
  try {
    const updated = await comment.findByIdAndUpdate(
      _id,
      { $set: { commentbody } },
      { new: true }
    );
    return res.status(200).json(updated);
  } catch (error) {
    console.error("Edit comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const likecomment = async (req, res) => {
  const { id: _id } = req.params;
  const { userid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Comment not found" });
  }
  try {
    const found = await comment.findById(_id);
    if (!found) return res.status(404).json({ message: "Comment not found" });

    const alreadyLiked = found.likedBy.includes(userid);
    const alreadyDisliked = found.dislikedBy.includes(userid);

    if (alreadyLiked) {
      // Toggle off like
      found.likedBy = found.likedBy.filter((id) => id !== userid);
      found.likes = Math.max(0, found.likes - 1);
    } else {
      // Add like; remove dislike if present
      found.likedBy.push(userid);
      found.likes += 1;
      if (alreadyDisliked) {
        found.dislikedBy = found.dislikedBy.filter((id) => id !== userid);
        found.dislikes = Math.max(0, found.dislikes - 1);
      }
    }
    await found.save();
    return res.status(200).json(found);
  } catch (error) {
    console.error("Like comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const dislikecomment = async (req, res) => {
  const { id: _id } = req.params;
  const { userid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Comment not found" });
  }
  try {
    const found = await comment.findById(_id);
    if (!found) return res.status(404).json({ message: "Comment not found" });

    const alreadyDisliked = found.dislikedBy.includes(userid);
    const alreadyLiked = found.likedBy.includes(userid);

    if (alreadyDisliked) {
      // Toggle off dislike
      found.dislikedBy = found.dislikedBy.filter((id) => id !== userid);
      found.dislikes = Math.max(0, found.dislikes - 1);
    } else {
      // Add dislike; remove like if present
      found.dislikedBy.push(userid);
      found.dislikes += 1;
      if (alreadyLiked) {
        found.likedBy = found.likedBy.filter((id) => id !== userid);
        found.likes = Math.max(0, found.likes - 1);
      }
    }
    await found.save();

    // Auto-delete if dislikes >= 2
    if (found.dislikes >= 2) {
      await comment.findByIdAndDelete(_id);
      return res.status(200).json({ autoDeleted: true, message: "Comment removed due to 2 dislikes" });
    }

    return res.status(200).json(found);
  } catch (error) {
    console.error("Dislike comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
