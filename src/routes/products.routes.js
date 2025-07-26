import { Router } from "express";
import { addProduct, productList, updateProduct} from "../controllers/product.controller.js";
import { verifyJWT, isAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/').get(productList);
router.route('/add').post(verifyJWT, isAdmin, addProduct);
router.route('/update/:productId').patch(verifyJWT, isAdmin, updateProduct);

export default router;