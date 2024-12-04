import express from 'express';
import { productController } from '../controllers/productController.js';
import { isAuthenticated } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.get('/', productController.getHome);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/product/:id', productController.getProduct);

// Product management routes
router.get('/products/add', isAuthenticated, productController.getAddProduct);
router.post('/products/add', isAuthenticated, upload.array('images', 5), productController.addProduct);
router.get('/products/:id/edit', isAuthenticated, productController.getEditProduct);
router.post('/products/:id/edit', isAuthenticated, upload.array('images', 5), productController.updateProduct);
router.post('/products/:id/delete', isAuthenticated, productController.deleteProduct);

// Image management
router.post('/products/:id/images/delete', isAuthenticated, productController.deleteImage);

// Variant management
router.get('/products/:id/variants', isAuthenticated, productController.getAddVariants);
router.post('/products/:id/variants', isAuthenticated, productController.addVariant);
router.put('/products/:id/variants/:variantId', isAuthenticated, productController.updateVariant);
router.delete('/products/:id/variants/:variantId', isAuthenticated, productController.deleteVariant);

export default router;