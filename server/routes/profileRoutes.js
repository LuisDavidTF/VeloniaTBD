import express from 'express';
import { profileController } from '../controllers/profileController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

router.get('/', isAuthenticated, profileController.getProfile);
router.get('/edit', isAuthenticated, profileController.getEditProfile);
router.post('/edit', isAuthenticated, profileController.updateProfile);

export default router;