import express from 'express';
import {
    createMobiPaidPaymentRequest,
    handleMobiPaidWebhook,
    refundMobiPaidPaymentForBooking,
    recordPayment,
    getTransactions,
    updateTransactionStatus,
} from '../controllers/paymentController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/create-intent', protect, createMobiPaidPaymentRequest);
router.post('/mobipaid-webhook', handleMobiPaidWebhook);
router.post('/refund', protect, admin, refundMobiPaidPaymentForBooking);
router.post('/record', protect, recordPayment);
router.get('/', protect, admin, getTransactions);
router.put('/:id/status', protect, admin, updateTransactionStatus);

export default router;
