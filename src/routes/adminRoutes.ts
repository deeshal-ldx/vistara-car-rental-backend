import express from 'express';
import {
    getDashboardStats,
    getUsers,
    deleteUser,
} from '../controllers/adminController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/stats', protect, admin, getDashboardStats);
router.get('/users', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);

export default router;
