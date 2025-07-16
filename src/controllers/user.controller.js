import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateAccessAndRefreshToken } from '../utils/token.helper.js';
import jwt from 'jsonwebtoken';

// Register
const registerUser = async (req, res) => {
  const { email, password, fullName } = req.body;

  if ([fullName, email, password].some(field => !field?.trim())) {
    throw new ApiError(400, 'All fields are required');
  }

  const existedUser = await User.findOne({ email }).select('_id');

  if (existedUser) {
    throw new ApiError(400, 'User already exists');
  }

  const user = await User.create({ fullName, password, email });

  const createdUser = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email
  };

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'User registered successfully'));
};

// Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email) throw new ApiError(401, 'Email is required for login');

  const user = await User.findOne({ email });

  if (!user) throw new ApiError(401, 'User does not exist');

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw new ApiError(401, 'Invalid credentials');

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user);

  const { password: _, refreshToken: __, ...safeUser } = user.toObject();

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(new ApiResponse(200, {
      user: safeUser,
      accessToken,
      refreshToken
    }, 'User logged in successfully'));
};

// Get current user
const getCurrentUser = async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, req.user || null, 'Current user fetched successfully')
  );
};

// Logout
const logoutUser = async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    sameSite: 'None',
    secure: process.env.NODE_ENV === 'production',
  };

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged out successfully'));
};

// Refresh access token
const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  try {
    const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded?._id).select('refreshToken email fullName');

    if (!user || incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
    };

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(new ApiResponse(200, { accessToken, refreshToken }, 'Token refreshed'));
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
};

// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const { id: userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ApiError(400, 'Invalid user ID'));
    }

    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    const requesterId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (requesterId !== userId && !isAdmin) {
      return next(new ApiError(403, 'Unauthorized to delete this user'));
    }

    await user.deleteOne();

    return res.status(200).json(new ApiResponse(200, null, 'User deleted successfully'));
  } catch (error) {
    next(new ApiError(500, 'Internal server error', error));
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  deleteUser
};