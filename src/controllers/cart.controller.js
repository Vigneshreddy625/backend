import {Cart} from "../models/cart.model.js"
import {Product} from "../models/product.model.js"
import mongoose from "mongoose";
import { validationResult } from "express-validator";


function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function populateCart(cart) {
  return await cart.populate({
    path: "items.product",
    select: "name price imageUrl stock",
  });
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [],
      shipping: { method: "Standard", cost: 5.99 },
      promoCode: { code: null, discount: 0, discountType: "amount" },
    });
    await cart.save();
  }
  return cart;
}

async function calculateCartTotals(cart) {
  await populateCart(cart);
  const subtotal = cart.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const taxRate = 0.07;
  const tax = subtotal * taxRate;
  let discount = 0;
  if (cart.promoCode && cart.promoCode.code) {
    discount = cart.promoCode.discountType === "percentage"
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

function handleError(error, res, operation) {
  console.error(`Error ${operation}:`, error);
  return res.status(error.statusCode || 500).json({
    message: error.message || `Failed to ${operation}`,
    error: process.env.NODE_ENV === "development" ? error.toString() : undefined,
  });
}


export async function getUserCart(req, res) {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await calculateCartTotals(cart);
    return res.status(200).json(cart);
  } catch (error) {
    return handleError(error, res, "fetch cart");
  }
}

export async function addItem(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    if (!isValidObjectId(productId)) return res.status(400).json({ message: "Invalid product ID" });
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ message: "Invalid quantity" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let cart = await Cart.findOne({ user: userId }).session(session);
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
          shipping: { method: "Standard", cost: 5.99 },
          promoCode: { code: null, discount: 0, discountType: "amount" },
        });
      }

      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }

      await calculateCartTotals(cart);
      await cart.save({ session });
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json(await populateCart(cart));
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error) {
    return handleError(error, res, "add item");
  }
}

export async function updateItemQuantity(req, res) {
  try {
    const { productId, quantity } = req.body;
    if (!isValidObjectId(productId)) return res.status(400).json({ message: "Invalid product ID" });
    if (!Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ message: "Invalid quantity" });

    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.find(item => item.product.toString() === productId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    if (quantity === 0) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
    } else {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
    }

    await calculateCartTotals(cart);
    await cart.save();
    return res.status(200).json(await populateCart(cart));
  } catch (error) {
    return handleError(error, res, "update item quantity");
  }
}

export async function removeItem(req, res) {
  try {
    const { productId } = req.params;
    if (!isValidObjectId(productId)) return res.status(400).json({ message: "Invalid product ID" });

    const cart = await getOrCreateCart(req.user.id);
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ message: "Item not found in cart" });

    cart.items.splice(itemIndex, 1);
    await calculateCartTotals(cart);
    await cart.save();
    return res.status(200).json(await populateCart(cart));
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

    const cart = await getOrCreateCart(req.user.id);
    cart.promoCode = { code, discount, discountType };
    await calculateCartTotals(cart);
    await cart.save();
    return res.status(200).json(await populateCart(cart));
  } catch (error) {
    return handleError(error, res, "apply promo code");
  }
}

export async function updateShipping(req, res) {
  try {
    const { method } = req.body;
    const shippingOptions = {
      Standard: 5.99,
      Express: 11.99,
    };

    if (!shippingOptions[method]) {
      return res.status(400).json({ message: "Invalid shipping method" });
    }

    const cart = await getOrCreateCart(req.user.id);
    cart.shipping = { method, cost: shippingOptions[method] };
    await calculateCartTotals(cart);
    await cart.save();
    return res.status(200).json(await populateCart(cart));
  } catch (error) {
    return handleError(error, res, "update shipping");
  }
}

export async function clearCart(req, res) {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = [];
    cart.promoCode = { code: null, discount: 0, discountType: "amount" };
    cart.shipping = { method: "Standard", cost: 5.99 };
    await calculateCartTotals(cart);
    await cart.save();
    return res.status(200).json(await populateCart(cart));
  } catch (error) {
    return handleError(error, res, "clear cart");
  }
}
