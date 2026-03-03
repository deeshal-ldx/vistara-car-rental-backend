import express from 'express';
import {
    getProtectionPlans,
    getProtectionPlanById,
    createProtectionPlan,
    updateProtectionPlan,
    deleteProtectionPlan,
} from '../controllers/protectionPlanController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/').get(getProtectionPlans).post(protect, admin, createProtectionPlan);
router
    .route('/:id')
    .get(getProtectionPlanById)
    .put(protect, admin, updateProtectionPlan)
    .delete(protect, admin, deleteProtectionPlan);

export default router;

