import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Wishlist } from '../models/wishlist.model.js';
import mongoose from 'mongoose';

const addToWishlist = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const userId = req.user?._id; 

        if (!userId) {
            return next(new ApiError(401, "Unauthorized: User not authenticated"));
        }

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return next(new ApiError(400, "Invalid product ID"));
        }

        let wishlist = await Wishlist.findOne({ user: userId });
        
        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: userId,
                items: []
            });
        }

        if (wishlist.items.includes(productId)) {
            return res.status(200).json(new ApiResponse(200, wishlist.items, "Product already in wishlist"));
        }

        wishlist.items.push(productId);
        await wishlist.save();

        return res.status(200).json(new ApiResponse(200, wishlist.items, "Product added to wishlist successfully"));

    } catch (error) {
        return next(new ApiError(500, "Failed to add product to wishlist", error));
    }
};

const removeFromWishlist = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            return next(new ApiError(401, "Unauthorized: User not authenticated"));
        }

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return next(new ApiError(400, "Invalid product ID"));
        }

        const wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            return next(new ApiError(404, "Wishlist not found"));
        }

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
        const userId = req.user?._id;

        if (!userId) {
            return next(new ApiError(401, "Unauthorized: User not authenticated"));
        }

        const wishlist = await Wishlist.findOne({ user: userId }).populate('items');

        if (!wishlist) {
            return res.status(200).json(new ApiResponse(200, [], "No wishlist found for this user"));
        }

        return res.status(200).json(new ApiResponse(200, wishlist.items, "User wishlist retrieved successfully"));

    } catch (error) {
        return next(new ApiError(500, "Failed to retrieve user wishlist", error));
    }
};

export { addToWishlist, removeFromWishlist, getUserWishlist };