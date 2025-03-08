import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if ([fullName, email, username, password].some((field) => field?.trim() === '')) {
    throw new ApiError(400, 'All fields are required');
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    throw new ApiError(409, 'User with email or username already exists');
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is required');
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avatar: avatar.url,
  });

  const createdUser = await User.findById(user._id).select('-password');
  if (!createdUser) {
    throw new ApiError(500, 'Error registering user');
  }

  req.session.userId = user._id;

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'User registered and logged in successfully'));
});


const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  req.session.user = {
    id: user._id,
    email: user.email,
    username: user.username,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, req.session.user, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      throw new ApiError(500, "Failed to log out");
    }
    res.clearCookie("connect.sid"); 
    res.status(200).json(new ApiResponse(200, {}, "User logged out successfully"));
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.session.user) {
    throw new ApiError(401, "Not authenticated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, req.session.user, "Current user fetched successfully"));
});

export { registerUser, loginUser, logoutUser, getCurrentUser };
