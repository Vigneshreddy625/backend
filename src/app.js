import express from "express"
import cookieParser from "cookie-parser"

import dotenv from "dotenv"

dotenv.config('./.env')

const app = express()

app.use(cors({ 
    origin: "http://localhost:5173", 
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type, Authorization"
  }));

app.use(express.json({limit: '16kb'}))
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.use(cookieParser())



import userRouter from "./routes/users.routes.js"

app.use("/api/v1/users", userRouter);


export { app }