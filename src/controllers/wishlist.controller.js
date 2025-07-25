import mongoose from "mongoose";
import { Wishlist } from "../models/wishlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!userId) return next(new ApiError(401, "Unauthorized: User not authenticated"));
    if (!isValidObjectId(productId)) return next(new ApiError(400, "Invalid product ID"));

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, items: [productId] });
      return res.status(200).json(new ApiResponse(200, wishlist.items, "Product added to wishlist successfully"));
    }

    const alreadyExists = wishlist.items.includes(productId);
    if (alreadyExists) {
      return res.status(200).json(new ApiResponse(200, wishlist.items, "Product already in wishlist"));
    }

    wishlist.items.push(productId);
    await wishlist.save();

    return res.status(200).json(new ApiResponse(200, wishlist.items, "Product added to wishlist successfully"));
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return next(new ApiError(500, "Failed to add product to wishlist", error));
  }
};


const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!userId) return next(new ApiError(401, "Unauthorized: User not authenticated"));
    if (!isValidObjectId(productId)) return next(new ApiError(400, "Invalid product ID"));

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) return next(new ApiError(404, "Wishlist not found"));

    wishlist.items = wishlist.items.filter(
      (item) => item.toString() !== productId.toString()
    );

    await wishlist.save();

    return res.status(200).json(new ApiResponse(200, wishlist.items, "Product removed from wishlist successfully"));
  } catch (error) {
    return next(new ApiError(500, "Failed to remove product from wishlist", error));
  }
};


const getUserWishlist = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) return next(new ApiError(401, "Unauthorized: User not authenticated"));

    const wishlist = await Wishlist.findOne({ user: userId }).populate({
      path: "items",
      select: "title price image stockStatus"
    });

    if (!wishlist) {
      return res.status(200).json(new ApiResponse(200, [], "No wishlist found for this user"));
    }

    return res.status(200).json(new ApiResponse(200, wishlist.items, "User wishlist retrieved successfully"));
  } catch (error) {
    return next(new ApiError(500, "Failed to retrieve user wishlist", error));
  }
};

export { addToWishlist, removeFromWishlist, getUserWishlist };
