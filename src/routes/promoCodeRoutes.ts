import express from 'express';
import {
    createPromoCode,
    getPromoCodes,
    getPromoCodeById,
    updatePromoCode,
    getPromoUsage,
    applyPromoCode,
    deletePromoCode,
} from '../controllers/promoCodeController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/').post(protect, admin, createPromoCode).get(protect, admin, getPromoCodes);
router
    .route('/:id')
    .get(protect, admin, getPromoCodeById)
    .patch(protect, admin, updatePromoCode)
    .delete(protect, admin, deletePromoCode);
router.get('/:id/usage', protect, admin, getPromoUsage);
router.post('/apply', protect, applyPromoCode);

export default router;
