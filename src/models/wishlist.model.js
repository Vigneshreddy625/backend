import mongoose, { Schema } from 'mongoose';

const WishlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, 
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
    ],
  },
  { timestamps: true } 
);

export const Wishlist = mongoose.model('Wishlist', WishlistSchema);
