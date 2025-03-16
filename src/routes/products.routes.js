import { Router } from "express";
import { productList } from "../controllers/product.controller.js";

const router = Router();

router.route('/').get(productList);

export default router;