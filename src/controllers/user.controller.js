import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === '')
  ) {
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

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );
  if (!createdUser) {
    throw new ApiError(500, 'Error registering user');
  }

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'User registered successfully'));
});

// Generate access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

// Login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  if (user.failedLoginAttempts >= 5) {
    throw new ApiError(403, "Account locked due to too many failed attempts. Please reset your password.");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    user.failedLoginAttempts += 1;
    await user.save({ validateBeforeSave: false });
    
    throw new ApiError(401, "Invalid credentials");
  }

  user.failedLoginAttempts = 0;

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -resetPasswordToken -resetPasswordExpires -failedLoginAttempts"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in successfully"
      )
    );
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null
      }
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request: Refresh token is required");
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token: User not found");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Refresh token has expired");
    }
    throw new ApiError(500, error?.message || "Failed to refresh access token");
  }
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }
  
  const user = await User.findById(req.user?._id);
  
  const isPasswordValid = await user.comparePassword(oldPassword);
  
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }
  
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// Request password reset
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  
  const user = await User.findOne({ email });
  
  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }
  
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });
  
  // Here you would typically send an email with the reset token
  // This is a placeholder for email sending functionality
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  return res
    .status(200)
    .json(
      new ApiResponse(
        200, 
        { resetUrl },
        "Password reset email sent successfully"
      )
    );
});

// Reset password using token
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    throw new ApiError(400, "Token and new password are required");
  }
  
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });
  
  if (!user) {
    throw new ApiError(400, "Token is invalid or has expired");
  }
  
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.failedLoginAttempts = 0;
  
  await user.save();
  
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

// Get current user (for authenticated routes)
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  requestPasswordReset,
  resetPassword,
  getCurrentUser,
  generateAccessAndRefreshTokens
};