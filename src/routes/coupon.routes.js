import { Router } from "express";
import { getAllCoupons } from "../controllers/coupon.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route('/').get(getAllCoupons);

export default router;