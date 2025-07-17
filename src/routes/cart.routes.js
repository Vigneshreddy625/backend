import { Router } from "express";
import {
  getUserCart,
  addItem,
  updateItemQuantity,
  removeItem,
  applyPromoCode,
  clearCart,
} from "../controllers/cart.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getUserCart);
router.route("/add").post(addItem);
router.route("/update").put(updateItemQuantity);
router.route("/remove/:productId").delete(removeItem);
router.route("/promo").post(applyPromoCode);
router.route("/clear").delete(clearCart);

export default router;
