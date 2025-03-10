import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  createAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} from '../controllers/address.controller.js';

const router = Router();

router.route('/')
  .post(verifyJWT, createAddress)
  .get(verifyJWT, getAddresses);

router.route('/:id')
  .put(verifyJWT, updateAddress)
  .delete(verifyJWT, deleteAddress);

export default router;
