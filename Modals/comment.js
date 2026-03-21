import mongoose from "mongoose";

const commentschema = mongoose.Schema({
  videoid: { type: String, required: true },
  userid: { type: String, required: true },
  commentbody: { type: String, required: true },
  usercommented: { type: String },
  city: { type: String, default: "Unknown" },
  commentedon: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  dislikedBy: [{ type: String }],
});

export default mongoose.model("comment", commentschema);
