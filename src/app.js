import express from "express"
import cookieParser from "cookie-parser"
import corsMiddleware from "./middlewares/cors.middleware.js"

const app = express()

app.use(corsMiddleware)

app.use(express.json({limit: '16kb'}))
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.use(cookieParser())

import userRouter from "./routes/users.routes.js"
import corsMiddleware from "./middlewares/cors.middleware.js"

app.use("/api/v1/users", userRouter);


export { app }