import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

import dotenv from "dotenv"

dotenv.config('./.env')

const app = express()

const allowedOrigins = [
  "http://localhost:5173/",             
  "https://revispy-nine.vercel.app/", 
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

app.use(express.json({limit: '16kb'}))
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.use(cookieParser())

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

import userRouter from "./routes/users.routes.js"
import addressRouter from "./routes/address.routes.js"
import productRouter from "./routes/products.routes.js"
import wishlistRouter from "./routes/wishlist.routes.js"
import cartRouter from "./routes/cart.routes.js"

app.use("/api/v1/users", userRouter);
app.use("/api/v1/addresses", addressRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/cart", cartRouter);

export { app }