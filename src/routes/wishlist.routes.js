import { Router } from 'express';
import {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
} from '../controllers/wishlist.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router
  .route('/')
  .post(verifyJWT, addToWishlist)
  .get(verifyJWT, getUserWishlist)
  .delete(verifyJWT, removeFromWishlist);

export default router;
