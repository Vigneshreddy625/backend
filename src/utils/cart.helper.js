import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";

export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export function createEmptyCart(userId) {
  return new Cart({
    user: userId,
    items: [],
    shipping: { method: "Standard", cost: SHIPPING_OPTIONS.Standard },
    promoCode: { code: null, discount: 0, discountType: "amount" },
  });
}

export async function populateCart(cart) {
  return await cart.populate({
    path: "items.product",
    select: "name price imageUrl stock",
  });
}

export async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = createEmptyCart(userId);
    await cart.save();
  }
  return cart;
}

export async function calculateCartTotals(cart) {
  await populateCart(cart);

  const subtotal = cart.items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;

  let discount = 0;
  if (cart.promoCode?.code) {
    discount =
      cart.promoCode.discountType === "percentage"
        ? (subtotal * cart.promoCode.discount) / 100
        : cart.promoCode.discount;
  }

  const shippingCost = cart.shipping?.cost || 0;
  const total = Math.max(0, subtotal + tax + shippingCost - discount);

  cart.subtotal = parseFloat(subtotal.toFixed(2));
  cart.tax = parseFloat(tax.toFixed(2));
  cart.total = parseFloat(total.toFixed(2));

  return cart;
}

export function handleError(error, res, operation) {
  console.error(`Error ${operation}:`, error);
  return res.status(error.statusCode || 500).json({
    message: error.message || `Failed to ${operation}`,
    error: process.env.NODE_ENV === "development" ? error.toString() : undefined,
  });
}