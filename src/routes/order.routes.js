import { Router } from "express";
import { getUserOrders, placeOrder, updateOrderStatus } from "../controllers/orders.controller.js";
import { isAdmin, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(verifyJWT, getUserOrders);
router.post("/place", placeOrder);
router.post("/update-status", verifyJWT, isAdmin, updateOrderStatus)

export default router;