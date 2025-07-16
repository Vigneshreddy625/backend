import { User } from '../models/user.model.js';
import { ApiError } from './ApiError.js';

export const generateAccessAndRefreshToken = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    await User.updateOne(
      { _id: user._id },
      { refreshToken },
      { runValidators: false }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Token generation failed: ' + error.message);
  }
};