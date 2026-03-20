import express from "express";
import { addtohistory, incrementviews, gethistory, removefromhistory } from "../controllers/history.js";

const routes = express.Router();

routes.post("/:videoId", addtohistory);
routes.post("/views/:videoId", incrementviews);
routes.get("/:userId", gethistory);
routes.delete("/:historyId", removefromhistory);

export default routes;
