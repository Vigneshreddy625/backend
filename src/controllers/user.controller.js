import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const registeredUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const newUser = new User({ email, password });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully", user: newUser });
});

export {registeredUser};