import express from "express";
import { togglewatchlater, getwatchlater } from "../controllers/watchlater.js";

const routes = express.Router();

routes.post("/:videoId", togglewatchlater);
routes.get("/:userId", getwatchlater);

export default routes;
