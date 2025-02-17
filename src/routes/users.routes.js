import { Router } from "express";
import { registeredUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

router.route("/register").post(registeredUser);

export default router;