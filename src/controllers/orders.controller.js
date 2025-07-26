import { Order } from '../models/orders.model.js';
import { Address } from '../models/address.model.js';
import { Product } from '../models/product.model.js';
import { User } from "../models/user.model.js"; 
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from 'mongoose';
import { clearCartForUser } from "../utils/cart.helper.js";

export const placeOrder = async (req, res) => {
  const {
    user,
    items,
    subtotal,
    tax,
    total,
    shipping,
    paymentMethod,
    shippingAddress: clientShippingAddress
  } = req.body;

  if (
    !user ||
    !items ||
    items.length === 0 ||
    subtotal === undefined ||
    tax === undefined ||
    total === undefined ||
    shipping === undefined ||
    !clientShippingAddress
  ) {
    return res.status(400).json({ message: "Missing required order details." });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newAddress = new Address({
      ...clientShippingAddress,
      user: user,
    });
    const savedAddress = await newAddress.save({ session });

    const orderItems = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      title: item.title,
    }));

    const newOrder = new Order({
      user: user,
      items: orderItems,
      subtotal: subtotal,
      tax: tax,
      total: total,
      shipping: shipping,
      paymentMethod: "Cash on Delivery",
      shippingAddress: savedAddress._id,
      orderStatus: "Pending",
    });

    const savedOrder = await newOrder.save({ session });

    await session.commitTransaction();
    session.endSession();

    await clearCartForUser(user);

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order: savedOrder.toObject({ getters: true, virtuals: false }),
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error placing order:", error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    if (error.code === 11000) {
      return res.status(409).json({ message: "Order ID collision, please try again." });
    }

    res.status(500).json({ message: "Failed to place order. Please try again later." });
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Returned"
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      throw new ApiError(400, "Invalid order status.");
    }

    const order = await Order.findById(orderId);

    if (!order) {
      throw new ApiError(404, "Order not found.");
    }

    if (["Delivered", "Cancelled"].includes(order.orderStatus)) {
      throw new ApiError(400, `Cannot update a ${order.orderStatus} order.`);
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "Shipped") {
      order.shippedAt = new Date();
    } else if (orderStatus === "Delivered") {
      order.deliveredAt = new Date();
    } else if (orderStatus === "Cancelled") {
      order.cancelledAt = new Date();
    }

    await order.save();

    return res.status(200).json(
      new ApiResponse(200, order, "Order status updated successfully.")
    );

  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id; 

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { user: userId };
    if (req.query.status) {
      const allowedStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"];
      if (allowedStatuses.includes(req.query.status)) {
        filter.orderStatus = req.query.status;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid order status: ${req.query.status}. Allowed values are: ${allowedStatuses.join(', ')}.`,
        });
      }
    }

    const sort = { createdAt: -1 };

    const orders = await Order.find(filter)
      .populate({
        path: "user",
        select: "username email", 
      })
      .populate({
        path: "items.productId", 
        select: "title price image stockStatus category brand", 
      })
      .populate({
        path: "shippingAddress",
        select: "street city state postalCode country", 
      })
      .sort(sort) 
      .skip(skip) 
      .limit(limit); 

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this user matching the criteria.",
        data: [],
        pagination: {
          totalOrders: 0,
          currentPage: page,
          totalPages: 0,
          limit: limit,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully.",
      data: orders,
      pagination: {
        totalOrders: totalOrders,
        currentPage: page,
        totalPages: totalPages,
        limit: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);

    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while fetching orders.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined, 
    });
  }
};