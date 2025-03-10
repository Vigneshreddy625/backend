import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

import dotenv from "dotenv"

dotenv.config('./.env')

const app = express()

app.use(cors({
  origin: (origin, callback) => {
    callback(null, origin || "*"); 
  },
  credentials: true,
  methods: "GET, POST, PUT, DELETE",
  allowedHeaders: "Content-Type, Authorization"
}));



app.use(express.json({limit: '16kb'}))
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.use(cookieParser())



import userRouter from "./routes/users.routes.js"
import addressRouter from "./routes/address.routes.js"

app.use("/api/v1/users", userRouter);
app.use("/api/v1/addresses", addressRouter);


export { app }