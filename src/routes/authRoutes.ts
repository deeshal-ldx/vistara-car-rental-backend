import express from 'express';
import { registerUser, loginUser, upsertUser } from '../controllers/authController';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/upsert', upsertUser);

export default router;
