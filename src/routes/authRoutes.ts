import express from 'express';
import { registerUser, loginUser, upsertUser, getUserProfile, updateUserProfile } from '../controllers/authController';

import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/upsert', upsertUser);
router.get('/profile', protect, getUserProfile);
router.patch('/profile', protect, updateUserProfile);

export default router;
