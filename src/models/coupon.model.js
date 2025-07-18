import mongoose, { Schema } from "mongoose";

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
  maxDiscountAmount: {
    type: Number,
    default: null, 
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
  isActive: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    default: '',
  }
}, {
  timestamps: true 
});

couponSchema.index({ code: 1 });
couponSchema.index({ expiryDate: 1 });
couponSchema.index({ isActive: 1 });

couponSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

couponSchema.methods.isValid = function() {
  return this.isActive && new Date() <= new Date(this.expiryDate);
};

couponSchema.methods.canUserUse = function(userId) {
  return !this.usersUsed.includes(userId) && this.usersUsed.length < this.usageLimit;
};

export const Coupon = mongoose.model('Coupon', couponSchema);