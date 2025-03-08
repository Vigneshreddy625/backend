import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
