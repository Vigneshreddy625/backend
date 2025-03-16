import mongoose,{Schema} from "mongoose";

const ProductSchema = new Schema(
  {
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
  }
);

ProductSchema.virtual('discount').get(function () {
  return Math.round(
    ((this.originalPrice - this.price) / this.originalPrice) * 100
  );
});

export const Product = mongoose.model('Product', ProductSchema);
