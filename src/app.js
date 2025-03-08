import express from "express"
import cookieParser from "cookie-parser"
import corsMiddleware from "./middlewares/cors.middleware.js"
import MongoStore from "connect-mongo"
import session from "express-session"
import dotenv from "dotenv"

dotenv.config('./.env')

const app = express()

app.use(corsMiddleware)

app.use(express.json({limit: '16kb'}))
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.use(cookieParser())

app.use(
    session({
      secret: `${process.env.ACCESS_TOKEN_SECRET}`, 
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: `${process.env.MONGODB_URI}`, 
        collectionName: "sessions",
      }),
      cookie: {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        maxAge: 1000 * 60 * 60 * 128, 
      },
    })
  );

import userRouter from "./routes/users.routes.js"

app.use("/api/v1/users", userRouter);


export { app }