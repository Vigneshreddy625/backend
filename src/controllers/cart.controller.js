import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { Coupon } from "../models/coupon.model.js";
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
      promoCode: { code: null, discount: 0, discountType: "amount" },
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

  let discount = 0;
  if (cart.promoCode?.code) {
    discount =
      cart.promoCode.discountType === "percentage"
        ? (subtotal * cart.promoCode.discount) / 100
        : cart.promoCode.discount;
  }

  let shippingCost = subtotal > 1000 ? 0 : 5.99;

  cart.shipping = {
    method: cart.shipping?.method || "Standard",
    cost: shippingCost, 
  };

  const total = Math.max(0, subtotal + tax + shippingCost - discount);

  cart.subtotal = parseFloat(subtotal.toFixed(2));
  cart.tax = parseFloat(tax.toFixed(2));
  cart.discount = parseFloat(discount.toFixed(2));
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
          promoCode: { code: null, discount: 0, discountType: "amount" },
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

// NEW: Get available coupons for user
export async function getAvailableCoupons(req, res) {
  try {
    const userId = req.user.id;
    const cart = await getOrCreateCart(userId);
    await populateCart(cart);
    
    const subtotal = cart.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );

    // Query works with both old and new model structure
    const query = { 
      expiryDate: { $gte: new Date() },
      usersUsed: { $ne: userId }
    };
    
    // Add isActive check only if field exists in your model
    // If you haven't added isActive field yet, this will be ignored
    if (await Coupon.findOne().select('isActive').lean()) {
      query.isActive = true;
    }

    const coupons = await Coupon.find(query);

    const formattedCoupons = coupons.map(coupon => {
      const canApply = subtotal >= coupon.minOrderAmount;
      const shopMoreAmount = canApply ? 0 : coupon.minOrderAmount - subtotal;
      
      let savings = 0;
      if (canApply) {
        savings = coupon.discountType === "percentage"
          ? Math.min(
              (subtotal * coupon.discountValue) / 100, 
              coupon.maxDiscountAmount || Infinity
            )
          : coupon.discountValue;
      }

      return {
        id: coupon._id,
        code: coupon.code,
        discount: coupon.discountType === "percentage" 
          ? `${coupon.discountValue}% off`
          : `Rs. ${coupon.discountValue} off`,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchase: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        expiryDate: new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        expiryTime: "11:59 PM",
        canApply,
        shopMoreAmount,
        savings: Math.round(savings),
        isApplied: cart.promoCode?.code === coupon.code
      };
    });

    return res.status(200).json({
      coupons: formattedCoupons,
      currentSubtotal: subtotal,
      appliedCoupon: cart.promoCode?.code || null
    });
  } catch (error) {
    return handleError(error, res, "fetch available coupons");
  }
}

// ENHANCED: Apply promo code with better validation
export async function applyPromoCode(req, res) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Promo code is required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: "Invalid promo code" });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: "Promo code has expired" });
    }

    const userId = req.user.id;
    
    if (coupon.usersUsed.includes(userId)) {
      return res.status(400).json({ message: "You have already used this promo code" });
    }

    let cart = await getOrCreateCart(userId);
    await populateCart(cart);

    const subtotal = cart.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount of ₹${coupon.minOrderAmount} is required for this coupon`,
        minOrderAmount: coupon.minOrderAmount,
        currentAmount: subtotal,
        shopMoreAmount: coupon.minOrderAmount - subtotal
      });
    }

    // Remove previous coupon if exists
    if (cart.promoCode?.code) {
      const previousCoupon = await Coupon.findOne({ code: cart.promoCode.code });
      if (previousCoupon) {
        previousCoupon.usersUsed = previousCoupon.usersUsed.filter(id => id.toString() !== userId);
        await previousCoupon.save();
      }
    }

    cart.promoCode = {
      code: coupon.code,
      discount: coupon.discountValue,
      discountType: coupon.discountType === "fixed" ? "amount" : "percentage",
    };

    await calculateCartTotals(cart);

    coupon.usersUsed.push(userId);
    await coupon.save();

    await cart.save();
    cart = await populateCart(cart);

    return res.status(200).json({
      message: "Promo code applied successfully",
      cart,
      savings: cart.discount
    });
  } catch (error) {
    return handleError(error, res, "apply promo code");
  }
}

// NEW: Remove promo code
export async function removePromoCode(req, res) {
  try {
    const userId = req.user.id;
    let cart = await getOrCreateCart(userId);
    
    if (cart.promoCode?.code) {
      const coupon = await Coupon.findOne({ code: cart.promoCode.code });
      if (coupon) {
        coupon.usersUsed = coupon.usersUsed.filter(id => id.toString() !== userId);
        await coupon.save();
      }
    }

    cart.promoCode = { code: null, discount: 0, discountType: "amount" };
    await calculateCartTotals(cart);
    await cart.save();
    cart = await populateCart(cart);
    
    return res.status(200).json({
      message: "Promo code removed successfully",
      cart
    });
  } catch (error) {
    return handleError(error, res, "remove promo code");
  }
}

// NEW: Validate coupon without applying
export async function validateCoupon(req, res) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Promo code is required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ message: "Invalid promo code" });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: "Promo code has expired" });
    }

    const userId = req.user.id;
    
    if (coupon.usersUsed.includes(userId)) {
      return res.status(400).json({ message: "You have already used this promo code" });
    }

    const cart = await getOrCreateCart(userId);
    await populateCart(cart);

    const subtotal = cart.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );

    const canApply = subtotal >= coupon.minOrderAmount;
    let savings = 0;
    
    if (canApply) {
      savings = coupon.discountType === "percentage"
        ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity)
        : coupon.discountValue;
    }

    return res.status(200).json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount: coupon.discountType === "percentage" 
          ? `${coupon.discountValue}% off`
          : `Rs. ${coupon.discountValue} off`,
        minPurchase: coupon.minOrderAmount,
        canApply,
        savings: Math.round(savings),
        shopMoreAmount: canApply ? 0 : coupon.minOrderAmount - subtotal
      }
    });
  } catch (error) {
    return handleError(error, res, "validate coupon");
  }
}

export async function clearCart(req, res) {
  try {
    const userId = req.user.id;
    let cart = await getOrCreateCart(userId);
    
    // Remove coupon usage if exists
    if (cart.promoCode?.code) {
      const coupon = await Coupon.findOne({ code: cart.promoCode.code });
      if (coupon) {
        coupon.usersUsed = coupon.usersUsed.filter(id => id.toString() !== userId);
        await coupon.save();
      }
    }

    cart.items = [];
    cart.promoCode = { code: null, discount: 0, discountType: "amount" };
    cart.shipping = { method: "Standard", cost: 5.99 };

    await calculateCartTotals(cart);
    await cart.save();
    cart = await populateCart(cart);
    return res.status(200).json(cart);
  } catch (error) {
    return handleError(error, res, "clear cart");
  }
}