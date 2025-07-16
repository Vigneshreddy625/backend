import { Address } from "../models/address.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// CREATE Address
const createAddress = async (req, res, next) => {
  try {
    const {
      type, name, mobile, street, city, state, postalCode,
      country, houseNo, district, locality
    } = req.body;

    if (!type || !name || !mobile || !street || !city || !state || !postalCode || !district || !country) {
      return next(new ApiError(400, "All required fields must be provided"));
    }

    const addressData = {
      type, name, mobile, street, city, state, postalCode,
      country, houseNo, district, locality
    };

    const existing = await Address.exists({ user: req.user.id });

    if (!existing) {
      await Address.create({
        user: req.user.id,
        addresses: [addressData],
      });
    } else {
      await Address.updateOne(
        { user: req.user.id },
        { $push: { addresses: addressData } }
      );
    }

    const updated = await Address.findOne({ user: req.user.id }, { addresses: 1 });
    return res.status(201).json(new ApiResponse(201, updated.addresses, "Address added successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal server error", error));
  }
};

// READ Addresses
const getAddresses = async (req, res, next) => {
  try {
    const address = await Address.findOne({ user: req.user.id }, { addresses: 1 })

    if (!address || address.addresses.length === 0) {
      return next(new ApiError(404, "No addresses found"));
    }

    return res.status(200).json(new ApiResponse(200, address.addresses, "Addresses retrieved successfully"));
  } catch (error) {
    return next(new ApiError(500, "User not authorized", error));
  }
};

// UPDATE Address
const updateAddress = async (req, res, next) => {
  try {
    const { id: addressId } = req.params;
    const {
      type, name, mobile, street, city, state, postalCode,
      country, houseNo, district, locality
    } = req.body;

    const updatedData = {
      _id: addressId,
      type, name, mobile, street, city, state, postalCode,
      country, houseNo, district, locality
    };

    const result = await Address.updateOne(
      { user: req.user.id, "addresses._id": addressId },
      { $set: { "addresses.$": updatedData } }
    );

    if (result.matchedCount === 0) {
      return next(new ApiError(404, "Address not found"));
    }

    const updated = await Address.findOne({ user: req.user.id }, { addresses: 1 });
    return res.status(200).json(new ApiResponse(200, updated.addresses, "Address updated successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal server error", error));
  }
};

// DELETE Address
const deleteAddress = async (req, res, next) => {
  try {
    const { id: addressId } = req.params;

    const result = await Address.updateOne(
      { user: req.user.id },
      { $pull: { addresses: { _id: addressId } } }
    );

    if (result.modifiedCount === 0) {
      return next(new ApiError(404, "Address not found"));
    }

    return res.status(200).json(new ApiResponse(200, null, "Address deleted successfully"));
  } catch (error) {
    return next(new ApiError(500, "Internal server error", error));
  }
};

export {
  createAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
};
