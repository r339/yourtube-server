import express from "express";
import { trackdownload, getuserdownloads } from "../controllers/download.js";

const routes = express.Router();

routes.post("/track", trackdownload);
routes.get("/user/:userId", getuserdownloads);

export default routes;
