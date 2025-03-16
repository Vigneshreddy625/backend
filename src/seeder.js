import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { Product } from "./models/Product.model.js";
import Products from "./data/Products.js";
import lodash from "lodash"; 

const { chunk } = lodash; 

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    await Product.deleteMany();
    console.log("Existing products removed");

    const chunkSize = 10;
    const chunkedData = chunk(Products, chunkSize); 

    for (const batch of chunkedData) {
      await Product.insertMany(batch);
      console.log(`Inserted ${batch.length} products`);
    }

    console.log("All products inserted successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error inserting products:", error);
    process.exit(1);
  }
};

seedDatabase();
