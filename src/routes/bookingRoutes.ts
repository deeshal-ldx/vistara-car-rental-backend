import express from 'express';
import {
    createBooking,
    getBookings,
    getBookingById,
    updateBookingStatus,
} from '../controllers/bookingController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/').post(protect, createBooking).get(protect, getBookings);
router.route('/:id').get(protect, getBookingById);
router.route('/:id/status').put(protect, admin, updateBookingStatus);

export default router;
