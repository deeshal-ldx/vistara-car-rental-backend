import { Request, Response } from 'express';
import User from '../models/User';
import Car from '../models/Car';
import Booking from '../models/Booking';
import Transaction from '../models/Transaction';
import PromoCode from '../models/PromoCode';

// @desc    Get dashboard stats
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req: Request, res: Response) => {
    const settings = {
        users: await User.countDocuments(),
        cars: await Car.countDocuments(),
        bookings: await Booking.countDocuments(),
        activepromos: await PromoCode.countDocuments({ isActive: true }),
    };

    // Calculate total revenue from successful transactions
    const revenueResult = await Transaction.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Recent bookings
    const recentBookings = await Booking.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name')
        .populate('car', 'make carModel');

    res.json({
        counts: settings,
        totalRevenue,
        recentBookings,
    });
};

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response) => {
    const users = await User.find({});
    res.json(users);
};

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};
