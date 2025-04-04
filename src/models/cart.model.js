import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    promoCode: {
      code: { type: String, default: null },
      discount: { type: Number, default: 0 }, 
    },
    shipping: {
      method: {
        type: String,
        enum: ["Standard", "Express"],
        default: "Standard",
      },
      cost: { type: Number, default: 5.99 }, 
    },
    subtotal: { type: Number, default: 0 }, 
    tax: { type: Number, default: 0 }, 
    total: { type: Number, default: 0 }, 
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema)