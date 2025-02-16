import connectDB from "./db/db.js";
import { app } from "./app.js";
import dotenv from "dotenv"

dotenv.config({
    path: './.env'
});

const PORT = process.env.PORT || 5000;

connectDB()
.then(() => {
    app.listen(PORT, () => {
        console.log(`⚙️ Server is running at port : ${PORT}`);
    });
})
.catch((error) => {
    console.log("Mongodb connection failed ", error); 
})

