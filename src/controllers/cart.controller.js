import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";
import { validationResult } from "express-validator";

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function populateCart(cart) {
  return await cart.populate("items.product"); 
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [],
      shipping: { method: "Standard", cost: 5.99 },
    });
    await cart.save();
  }
  return cart;
}

async function calculateCartTotals(cart) {
  await populateCart(cart);

  const subtotal = cart.items.reduce(
    (total, item) => total + Number((item.product.price * item.quantity).toFixed(2)),
    0
  );

  const taxRate = 0.07;
  const tax = subtotal * taxRate;

  // Free shipping for orders over ₹1000
  let shippingCost = subtotal > 1000 ? 0 : 5.99;

  cart.shipping = {
    method: cart.shipping?.method || "Standard",
    cost: shippingCost, 
  };

  const total = subtotal + tax + shippingCost;

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
    let cart = await getOrCreateCart(req.user.id);
    await calculateCartTotals(cart);
    cart = await populateCart(cart);
    return res.status(200).json(cart);
  } catch (error) {
    return handleError(error, res, "fetch cart");
  }
}

export async function addItem(req, res) {
  try {
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
        cart = new Cart({
          user: userId,
          items: [],
          shipping: { method: "Standard", cost: 5.99 },
        });
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
      session.endSession();

      cart = await populateCart(cart);
      return res.status(200).json(cart);
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
    cart = await populateCart(cart);
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

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    await calculateCartTotals(cart);
    await cart.save();

    const populatedCart = await populateCart(cart);

    return res.status(200).json(populatedCart);
  } catch (error) {
    return handleError(error, res, "remove item");
  }
}

export async function clearCart(req, res) {
  try {
    const userId = req.user.id;
    let cart = await getOrCreateCart(userId);
    
    cart.items = [];
    cart.shipping = { method: "Standard", cost: 5.99 };

    await calculateCartTotals(cart);
    await cart.save();
    cart = await populateCart(cart);
    return res.status(200).json(cart);
  } catch (error) {
    return handleError(error, res, "clear cart");
  }
}