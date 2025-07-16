import { Address } from "../models/address.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createAddress = async (req, res, next) => {
  try {
    const { type, name, mobile, street, city, state, postalCode, country, houseNo, district, locality } = req.body;

    if (!type || !name || !mobile || !street || !city || !state || !postalCode || !district || !country) {
      return next(new ApiError(400, "All fields are required"));
    }

    const addressData = { type, name, mobile, street, city, state, postalCode, country, houseNo, district, locality };

    const addressDoc = await Address.findOneAndUpdate(
      { user: req.user.id },
      { $push: { addresses: addressData } },
      { new: true, upsert: true }
    );

    res.status(201).json(new ApiResponse(201, addressDoc.addresses, "Address added successfully"));
  } catch (error) {
    next(new ApiError(500, "Internal server error", error));
  }
};

const getAddresses = async (req, res, next) => {
    try {
        const address = await Address.findOne({ user: req.user.id });
        if (!address) {
            return next(new ApiError(404, "No addresses found"));
        }
        res.status(200).json(new ApiResponse(200, address.addresses, "Addresses retrieved successfully")); 
    } catch (error) {
        next(new ApiError(500, "Internal server error", error));
    }
};

const updateAddress = async (req, res, next) => {
    try {
        const { id: addressId } = req.params;
        const { type, name, mobile, street, city, state, postalCode, country, houseNo, district, locality } = req.body;

        let address = await Address.findOne({ user: req.user.id });

        if (!address) {
            return next(new ApiError(404, "Address not found"));
        }

        const addressIndex = address.addresses.findIndex((addr) => addr._id.toString() === addressId);

        if (addressIndex === -1) {
            return next(new ApiError(404, "Address not found"));
        }

        address.addresses[addressIndex] = { _id: addressId, type, name, mobile, street, city, district, state, postalCode, country, houseNo, locality };

        await address.save();
        res.status(200).json(new ApiResponse(200, address.addresses, "Address updated successfully")); 
    } catch (error) {
        next(new ApiError(500, "Internal server error", error));
    }
};

const deleteAddress = async (req, res, next) => {
    try {
        const { id: addressId } = req.params;

        const address = await Address.findOne({ user: req.user.id });

        if (!address) {
            return next(new ApiError(404, "No address record found for this user"));
        }

        const existingAddress = address.addresses.find((addr) => addr._id.toString() === addressId);
        if (!existingAddress) {
            return next(new ApiError(404, "Address not found"));
        }

        address.addresses = address.addresses.filter((addr) => addr._id.toString() !== addressId);
        await address.save();

        res.status(200).json(new ApiResponse(200, null, "Address deleted successfully"));
    } catch (error) {
        next(new ApiError(500, "Internal server error", error));
    }
};
export { createAddress, getAddresses, updateAddress, deleteAddress };