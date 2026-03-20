import comment from "../Modals/comment.js";
import mongoose from "mongoose";

export const postcomment = async (req, res) => {
  const { videoid, userid, commentbody, usercommented } = req.body;
  if (!videoid || !userid || !commentbody) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const newComment = new comment({ videoid, userid, commentbody, usercommented });
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
