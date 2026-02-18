import express from 'express';
import {
    createPromoCode,
    getPromoCodes,
    applyPromoCode,
    deletePromoCode,
} from '../controllers/promoCodeController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/').post(protect, admin, createPromoCode).get(protect, admin, getPromoCodes);
router.post('/apply', protect, applyPromoCode);
router.route('/:id').delete(protect, admin, deletePromoCode);

export default router;
