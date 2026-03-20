import mongoose from "mongoose";

const likeschema = mongoose.Schema(
  {
    viewer: { type: String, required: true },
    videoid: { type: mongoose.Schema.Types.ObjectId, ref: "videofiles", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("like", likeschema);
