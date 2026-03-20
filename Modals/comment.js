import mongoose from "mongoose";

const commentschema = mongoose.Schema({
  videoid: { type: String, required: true },
  userid: { type: String, required: true },
  commentbody: { type: String, required: true },
  usercommented: { type: String },
  commentedon: { type: Date, default: Date.now },
});

export default mongoose.model("comment", commentschema);
