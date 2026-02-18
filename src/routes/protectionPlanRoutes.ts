import express from 'express';
import {
    getProtectionPlans,
    createProtectionPlan,
    updateProtectionPlan,
    deleteProtectionPlan,
} from '../controllers/protectionPlanController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/').get(getProtectionPlans).post(protect, admin, createProtectionPlan);
router
    .route('/:id')
    .put(protect, admin, updateProtectionPlan)
    .delete(protect, admin, deleteProtectionPlan);

export default router;

