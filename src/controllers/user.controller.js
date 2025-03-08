import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Error generating access and refresh tokens');
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email ) {
    throw new ApiError(400, 'Email is required');
  }

  const user = await User.findOne({email});
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  res
    .status(200)
    .cookie('accessToken', accessToken, { httpOnly: true, secure: true })
    .cookie('refreshToken', refreshToken, { httpOnly: true, secure: true })
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        'User logged in successfully'
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );
  res
    .status(200)
    .clearCookie('accessToken')
    .clearCookie('refreshToken')
    .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, 'User fetched successfully'));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, address } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { fullName, email, address } },
    { new: true }
  ).select('-password');

  res
    .status(200)
    .json(new ApiResponse(200, user, 'Account updated successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'unauthorized request');
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Refresh token is expired or used');
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          'Access token refreshed'
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateAccountDetails,
  refreshAccessToken,
};
