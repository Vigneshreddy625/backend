import mongoose, { Schema } from 'mongoose';

const ProductSchema = new Schema({
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
  discount: {
    type: String,
  },
  image: {
    type: String,
  },
  isNew: {
    type: Boolean,
  },
  isBestSeller: {
    type: Boolean,
  },
  rating: {
    type: Number,
  },
  reviews: {
    type: Number,
  },
  stockStatus: {
    type: String,
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
});

export const Product = mongoose.model('Product', ProductSchema);