import express from "express";
import { postcomment, getallcomment, deletecomment, editcomment } from "../controllers/comment.js";

const routes = express.Router();

routes.post("/postcomment", postcomment);
routes.get("/:videoid", getallcomment);
routes.delete("/deletecomment/:id", deletecomment);
routes.post("/editcomment/:id", editcomment);

export default routes;
