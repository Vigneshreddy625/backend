import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";
import { validationResult } from "express-validator";
import { SHIPPING_OPTIONS } from "../constants.js";
import { createEmptyCart } from "../utils/cart.helper.js";
import { getOrCreateCart } from "../utils/cart.helper.js";
import { calculateCartTotals } from "../utils/cart.helper.js";
import { handleError } from "../utils/cart.helper.js";
import { isValidObjectId } from "../utils/cart.helper.js";


export async function getUserCart(req, res) {
  try {
    let cart = await getOrCreateCart(req.user.id);
    await calculateCartTotals(cart);
    return res.status(200).json(cart);
  } catch (error) {
    return handleError(error, res, "fetch cart");
  }
}

export async function addItem(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { productId } = req.body;
  const userId = req.user.id;

  if (!isValidObjectId(productId)) return res.status(400).json({ message: "Invalid product ID" });

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let cart = await Cart.findOne({ user: userId }).session(session);

    if (!cart) {
      cart = createEmptyCart(userId);
      await cart.save({ session }); // ✅ Save cart if it's newly created
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += 1;
    } else {
      cart.items.push({ product: productId, quantity: 1 });
    }

    await calculateCartTotals(cart);
    await cart.save({ session });
    await session.commitTransaction();

    return res.status(200).json(cart);
  } catch (error) {
    await session.abortTransaction();
    return handleError(error, res, "add item");
  } finally {
    session.endSession();
  }
}

export async function updateItemQuantity(req, res) {
  try {
    const { productId, quantity } = req.body;

    if (!isValidObjectId(productId)) return res.status(400).json({ message: "Invalid product ID" });
    if (!Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ message: "Invalid quantity" });

    let cart = await getOrCreateCart(req.user.id);
    const item = cart.items.find(item => item.product.toString() === productId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    if (quantity === 0) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    await calculateCartTotals(cart);
    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    return handleError(error, res, "update item quantity");
  }
}

export async function removeItem(req, res) {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { items: { product: productId } } },
      { new: true }
    );

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    await calculateCartTotals(cart);
    await cart.save();

    return res.status(200).json(cart);
  } catch (error) {
    return handleError(error, res, "remove item");
  }
}

export async function applyPromoCode(req, res) {
  try {
    const { code, discount, discountType } = req.body;
    if (!code || discount == null || !["amount", "percentage"].includes(discountType)) {
      return res.status(400).json({ message: "Invalid promo code details" });
    }

    let cart = await getOrCreateCart(req.user.id);
    cart.promoCode = { code, discount, discountType };

    await calculateCartTotals(cart);
    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    return handleError(error, res, "apply promo code");
  }
}

export async function updateShipping(req, res) {
  try {
    const { method } = req.body;
    if (!SHIPPING_OPTIONS[method]) return res.status(400).json({ message: "Invalid shipping method" });

    let cart = await getOrCreateCart(req.user.id);
    cart.shipping = { method, cost: SHIPPING_OPTIONS[method] };

    await calculateCartTotals(cart);
    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    return handleError(error, res, "update shipping");
  }
}

export async function clearCart(req, res) {
  try {
    let cart = await getOrCreateCart(req.user.id);
    cart.items = [];
    cart.promoCode = { code: null, discount: 0, discountType: "amount" };
    cart.shipping = { method: "Standard", cost: SHIPPING_OPTIONS.Standard };

    await calculateCartTotals(cart);
    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    return handleError(error, res, "clear cart");
  }
}