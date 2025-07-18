import { Router } from "express";
import {
  getUserCart,
  addItem,
  updateItemQuantity,
  removeItem,
  applyPromoCode,
  clearCart,
  getAvailableCoupons,
  removePromoCode,
  validateCoupon
} from "../controllers/cart.controller.js";
import { body } from "express-validator";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getUserCart);
router.route("/add").post(addItem);
router.route("/update").put(updateItemQuantity);
router.route("/remove/:productId").delete(removeItem);
router.get('/coupons', getAvailableCoupons);

router.post('/validate-coupon', [
  body('code').notEmpty().withMessage('Coupon code is required')
], validateCoupon);

router.post('/apply-promo', [
  body('code').notEmpty().withMessage('Coupon code is required')
], applyPromoCode);

router.post('/remove-promo', removePromoCode);
router.route("/clear").delete(clearCart);

export default router;
