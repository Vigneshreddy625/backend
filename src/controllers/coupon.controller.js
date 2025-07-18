import { Coupon } from '../models/coupon.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find();

    if (coupons.length === 0) {
      return next(new ApiError(404, 'No coupons available at this time'));
    }

    res
      .status(200)
      .json(new ApiResponse(200, coupons, 'Coupons retrieved successfully'));
  } catch (error) {
    next(new ApiError(500, 'Failed to retrieve coupons'));
  }
};

export { getAllCoupons };
