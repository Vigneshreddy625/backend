import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while generating refresh and access token: ' +
        error.message
    );
  }
};

const registerUser = async (req, res) => {
  const { email, password, fullName } = req.body;

  if ([fullName, email, password].some((field) => field?.trim() === '')) {
    throw new ApiError(400, 'All fields are required');
  }

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(400, 'User already exists');
  }

  const user = await User.create({
    fullName,
    password,
    email,
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while registering user');
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'User registered successfully'));
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(401, 'Email is required for login');
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, 'User does not exist');
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'User logged in successfully'
      )
    );
};

const getCurrentUser = async (req, res) => {
  if (!req.user) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'No user logged in'));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'Current user fetched successfully'));
};


const logoutUser = async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
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

const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    console.log('Incoming Refresh Token:', incomingRefreshToken);
    console.log('Stored Refresh Token:', user?.refreshToken);

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Refresh token is expired or used');
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          'Access token refreshed successfully'
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id: userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new ApiError(400, "Invalid user ID"));
    }

    const user = await User.findById(userId);

    if (!user) {
      return next(new ApiError(404, "No User Found"));
    }

    if (req.user.id.toString() !== userId && req.user.role !== "admin") {
      return next(new ApiError(403, "You are not authorized to delete this user"));
    }

    await user.deleteOne();

    res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
  } catch (error) {
    next(new ApiError(500, "Internal server error", error));
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
