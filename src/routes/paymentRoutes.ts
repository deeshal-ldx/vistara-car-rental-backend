import express from 'express';
import {
    createPaymentIntent,
    confirmStripePayment,
    refundStripePaymentForBooking,
    recordPayment,
    getTransactions,
    updateTransactionStatus,
} from '../controllers/paymentController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmStripePayment);
router.post('/refund', protect, admin, refundStripePaymentForBooking);
router.post('/record', protect, recordPayment);
router.get('/', protect, admin, getTransactions);
router.put('/:id/status', protect, admin, updateTransactionStatus);

export default router;
