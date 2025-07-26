import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { validationResult } from "express-validator";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { upload } from '../middlewares/multer.middleware.js';
import fs from 'fs/promises'

export const productUploadMiddleware = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 5 } 
]);

const productList = async (req, res, next) => {
  try {
    const products = await Product.find();

    if (products.length === 0) {
      return next(new ApiError(404, 'No Products found'));
    }

    res
      .status(200)
      .json(new ApiResponse(200, products, 'Products retrieved successfully'));
  } catch (error) {
    next(new ApiError(500, 'Internal server error', error));
  }
};

const addProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.files && req.files.image) {
        await fs.unlink(req.files.image[0].path).catch(e => console.error("Failed to delete local image:", e));
      }
      if (req.files && req.files.images && req.files.images.length > 0) {
        for (const file of req.files.images) {
          await fs.unlink(file.path).catch(e => console.error("Failed to delete local array image:", e));
        }
      }
      return next(new ApiError(400, 'Invalid product data', errors.array()));
    }

    const productData = req.body;
    let imageUrl = null;
    let arrayImageUrls = [];

    if (req.files && req.files.image && req.files.image.length > 0) {
      const imageLocalPath = req.files.image[0].path;
      imageUrl = await uploadOnCloudinary(imageLocalPath);

      if (!imageUrl) {
        return next(new ApiError(500, 'Failed to upload main product image.'));
      }
    } else {
        return next(new ApiError(400, 'Main product image is required.'));
    }

    if (req.files && req.files.images && req.files.images.length > 0) {
      for (const file of req.files.images) {
        const url = await uploadOnCloudinary(file.path);
        if (url) {
          arrayImageUrls.push(url);
        } else {
          console.warn(`Failed to upload an additional image: ${file.originalname}`);
        }
      }
    }

    productData.image = imageUrl;
    productData.images = arrayImageUrls;

    const product = new Product(productData);
    await product.save();

    res.status(201).json(new ApiResponse(201, product, 'Product added successfully.'));

  } catch (error) {
    console.error("Error adding product:", error);
    if (req.files) {
      if (req.files.image) {
        await fs.unlink(req.files.image[0].path).catch(e => console.error("Failed to clean up local image on error:", e));
      }
      if (req.files.arrayImages) {
        for (const file of req.files.images) {
          await fs.unlink(file.path).catch(e => console.error("Failed to clean up local array image on error:", e));
        }
      }
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(new ApiError(400, `Validation failed: ${errors.join(', ')}`, error));
    }
    if (error.name === 'CastError') {
      return next(new ApiError(400, `Invalid input for field '${error.path}'.`, error));
    }
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File size too large. Max 5MB allowed per image.'));
      }
    } else if (error.message.includes('Invalid file type')) { 
        return next(new ApiError(400, error.message));
    }

    next(new ApiError(500, 'Internal server error while adding product.', error));
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    if (!productId || productId.length !== 24) {
      return next(new ApiError(400, 'Invalid product ID'));
    }

    const allowedUpdates = ['title', 'brand', 'price', 'category', 'stockStatus', 'originalPrice', 'newArrival', 'isBestSeller']; // Add or remove fields as necessary
    const updatesToApply = {};

    for (const key in updateData) {
      if (allowedUpdates.includes(key)) {
        updatesToApply[key] = updateData[key];
      }
    }

    if (Object.keys(updatesToApply).length === 0) {
      return next(new ApiError(400, 'No valid fields to update provided.'));
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updatesToApply,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return next(new ApiError(404, 'Product not found'));
    }

    res.status(200).json(
      new ApiResponse(200, updatedProduct, 'Product updated successfully')
    );
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.name === 'ValidationError') {
      return next(new ApiError(400, error.message, error.errors)); 
    }
    next(new ApiError(500, 'Internal server error', error));
  }
};


export { productList, addProduct, updateProduct };
