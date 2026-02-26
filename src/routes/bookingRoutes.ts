import express from 'express';
import {
    createBooking,
    getBookings,
    getBookingById,
    updateBookingStatus,
    getUserCurrentBookings,
    getUserPastBookings,
    getUserBookingDetails,
} from '../controllers/bookingController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/me/current').get(protect, getUserCurrentBookings);
router.route('/me/past').get(protect, getUserPastBookings);
router.route('/me/:id').get(protect, getUserBookingDetails);

router.route('/').post(protect, createBooking).get(protect, getBookings);
router.route('/:id').get(protect, getBookingById);
router.route('/:id/status').put(protect, admin, updateBookingStatus);

export default router;
