import { Product } from '../models/product.model.js'
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const productList = async (req, res, next) => {
  try {
    const products = await Product.find();
    
    if (products.length === 0) {
      return next(new ApiError(404, 'No Products found'));
    }
    
    res.status(200).json(new ApiResponse(200, products.data, "Products retrieved successfully")); 
  } catch (error) {
    next(new ApiError(500, "Internal server error", error));
  }
};

export { productList };