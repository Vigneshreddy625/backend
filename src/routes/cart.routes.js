import { Router } from "express";
import {
  getUserCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
} from "../controllers/cart.controller.js";
import { body } from "express-validator";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getUserCart);
router.route("/add").post(addItem);
router.route("/update").put(updateItemQuantity);
router.route("/remove/:productId").delete(removeItem);
router.route("/clear").delete(clearCart);

export default router;
