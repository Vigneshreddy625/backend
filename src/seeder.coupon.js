import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { Coupon } from "./models/coupon.model.js"
import Coupons from "./data/Coupon.js"
import lodash from "lodash"; 

const { chunk } = lodash; 

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    await Coupon.deleteMany();
    console.log("Existing Coupons removed");

    const chunkSize = 10;
    const chunkedData = chunk(Coupons, chunkSize); 

    for (const batch of chunkedData) {
      await Coupon.insertMany(batch);
      console.log(`Inserted ${batch.length} products`);
    }

    console.log("All Coupons inserted successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error inserting Coupons:", error);
    process.exit(1);
  }
};

seedDatabase();
