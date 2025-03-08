import { ApiError } from "../utils/ApiError.js";

export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    throw new ApiError(401, "Unauthorized - Please log in");
  }
  next();
};
