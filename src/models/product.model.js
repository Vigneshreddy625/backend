import mongoose, { Schema } from "mongoose";
import { Counter } from './counter.model.js'

const ProductSchema = new Schema({
  productId: {
    type: String,
    unique: true,
    required: true,
    index: true 
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
  },
  newArrival: {
    type: Boolean,
  },
  isBestSeller: {
    type: Boolean,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  reviews: {
    type: Number,
  },
  stockStatus: {
    type: String,
    enum: ['In Stock', 'Out of Stock', 'Limited Stock'],
    default: 'In Stock',
  },
  stockQuantity: {
    type: Number,
  },
  category: {
    type: String,
  },
  brand: {
    type: String,
  },
  colors: [
    {
      name: String,
      value: String,
      hex: String,
    },
  ],
  sizes: [String],
  features: [String],
  shipping: {
    type: String,
  },
  returns: {
    type: String,
  },
  images: [String],
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

ProductSchema.virtual('discount').get(function () {
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

ProductSchema.pre("save", async function (next) {
  if (this.isNew && !this.productId) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'productId' },
        { $inc: { seq: 1 } }, 
        { new: true, upsert: true, runValidators: true } 
      );

      const newId = String(counter.seq).padStart(3, "0");
      this.productId = `P#${newId}`;
      next();
    } catch (error) {
      next(error); 
    }
  } else {
    next();
  }
});

export const Product = mongoose.model('Product', ProductSchema);