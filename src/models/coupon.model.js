import mongoose, {Schema} from "mongoose";

const couponSchema = new Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true 
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  usageLimit: {
    type: Number,
    default: 1,
  },
  usersUsed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});


export const Coupon = mongoose.model('Coupon', couponSchema)