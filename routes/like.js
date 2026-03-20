import express from "express";
import { handlelike, getallLikedVideo } from "../controllers/like.js";

const routes = express.Router();

routes.post("/:videoId", handlelike);
routes.get("/:userId", getallLikedVideo);

export default routes;
