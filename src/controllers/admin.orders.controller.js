import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js"; // Assuming you have a Product model

export const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have user authentication middleware
    const { shippingAddress } = req.body;

    // Validate required fields
    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address and payment method are required"
      });
    }

    // Find user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

    // Calculate pricing (you might want to recalculate tax and shipping)
    const tax = cart.tax || calculatedSubtotal * 0.1; // 10% tax or use cart value
    const shipping = cart.shipping.cost || 5.99;
    const total = cart.total || cart.subtotal + tax + shipping;
    

    // Create order
    const order = new Order({
      user: userId,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress, // Use shipping address if billing not provided
      promoCode: cart.promoCode,
      pricing: {
        subtotal: calculatedSubtotal,
        tax,
        shipping,
        total
      },
        status: cart.status || 'pending',
    });

    await order.save();

    // Update product stock (if you have stock management)
    // for (const item of cart.items) {
    //   await Product.findByIdAndUpdate(
    //     item.product._id,
    //     { $inc: { stock: -item.quantity } }
    //   );
    // }

    // Clear the cart after successful order
    await Cart.findByIdAndUpdate(cart._id, { 
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0
    });

    // Populate order for response
    await order.populate([
      { path: 'user', select: 'name email' },
      { path: 'items.product', select: 'name image price' }
    ]);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.pricing.total,
        createdAt: order.createdAt,
        items: order.items,
        shippingAddress: order.shippingAddress
      }
    });

  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message
    });
  }
};