import express from "express";
import { login, updateprofile, getuserbyid, upgradeplan } from "../controllers/auth.js";

const routes = express.Router();

routes.post("/login", login);
routes.patch("/update/:id", updateprofile);
routes.get("/:id", getuserbyid);
routes.post("/plan/upgrade", upgradeplan);

export default routes;
