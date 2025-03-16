import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    addresses: [
      {
        type: {
          type: String,
          enum: ["home", "work"],
          required: true,
        },
        name:{type: String, required: true},
        mobile:{type: Number, required: true},
        houseNo: {type: String},
        locality:{type:String},
        street: { type: String, required: true },
        city: { type: String, required: true },
        district : {type: String, required: true},
        state: { type: String, required: true },
        country: { type: String, required: true },
        postalCode: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Address = mongoose.model("Address", addressSchema);

