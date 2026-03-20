import express from "express";
import { getallvideo, uploadvideo, getvideosbyuploader, searchvideos, deletevideo } from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";

const routes = express.Router();

routes.post("/upload", upload.single("file"), uploadvideo);
routes.get("/getall", getallvideo);
routes.get("/search", searchvideos);
routes.get("/uploader/:uploaderId", getvideosbyuploader);
routes.delete("/:id", deletevideo);

export default routes;
