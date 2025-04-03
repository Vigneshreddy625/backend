import { Router } from 'express';
import {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
} from '../controllers/wishlist.controller';
import { verifyJWT } from '../middlewares/auth.middleware';

const router = Router();

router
  .route('/')
  .post(verifyJWT, addToWishlist)
  .get(verifyJWT, getUserWishlist)
  .delete(verifyJWT, removeFromWishlist);

export default router;
