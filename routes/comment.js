import express from "express";
import {
  postcomment,
  getallcomment,
  deletecomment,
  editcomment,
  likecomment,
  dislikecomment,
} from "../controllers/comment.js";

const routes = express.Router();

routes.post("/postcomment", postcomment);
routes.get("/:videoid", getallcomment);
routes.delete("/deletecomment/:id", deletecomment);
routes.post("/editcomment/:id", editcomment);
routes.post("/like/:id", likecomment);
routes.post("/dislike/:id", dislikecomment);

export default routes;
