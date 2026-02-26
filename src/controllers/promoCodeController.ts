import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import PromoCode from '../models/PromoCode';
import Booking from '../models/Booking';

// @desc    Create promo code
// @route   POST /api/v1/promos
// @access  Private/Admin
export const createPromoCode = async (req: Request, res: Response) => {
    const { code, discountType, value, expiryDate, minOrderValue, isActive, maxUsage } = req.body;

    const promoExists = await PromoCode.findOne({ code });

    if (promoExists) {
        res.status(400).json({ message: 'Promo code already exists' });
        return;
    }

    const promoCode = await PromoCode.create({
        code,
        discountType,
        value,
        expiryDate,
        minOrderValue,
        isActive,
        maxUsage,
    });

    res.status(201).json(promoCode);
};

// @desc    Get all promo codes with stats
// @route   GET /api/v1/promos
// @access  Private/Admin
export const getPromoCodes = async (req: Request, res: Response) => {
    const {
        search,
        usageStatus, // 'used', 'unused', 'all'
        page = '1',
        limit = '10',
    } = req.query as {
        search?: string;
        usageStatus?: 'used' | 'unused' | 'all';
        page?: string;
        limit?: string;
    };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const now = DateTime.utc().toJSDate();

    const query: any = {};

    // Search filter
    if (search) {
        query.code = { $regex: search, $options: 'i' };
    }

    // Usage status filter
    if (usageStatus === 'used') {
        query.usedCount = { $gt: 0 };
    } else if (usageStatus === 'unused') {
        query.usedCount = 0;
    }

    try {
        // 1. Get global stats (Total, Used, Unused, Active, Expired)
        const globalStats = await PromoCode.aggregate([
            {
                $group: {
                    _id: null,
                    totalPromos: { $sum: 1 },
                    usedPromos: { $sum: { $cond: [{ $gt: ['$usedCount', 0] }, 1, 0] } },
                    unusedPromos: { $sum: { $cond: [{ $eq: ['$usedCount', 0] }, 1, 0] } },
                    activePromos: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$isActive', true] },
                                        { $gt: ['$expiryDate', now] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    expiredPromos: { $sum: { $cond: [{ $lte: ['$expiryDate', now] }, 1, 0] } },
                },
            },
        ]);

        // 2. Get usage financial stats from Bookings
        const usageFinancialStats = await Booking.aggregate([
            { $match: { 'promo.code': { $exists: true } } },
            {
                $group: {
                    _id: '$promo.code',
                    totalDiscount: { $sum: '$promo.discountAmount' },
                    totalRevenue: { $sum: '$totalPrice' },
                },
            },
        ]);

        const financialMap = usageFinancialStats.reduce((acc, stat) => {
            acc[stat._id] = stat;
            return acc;
        }, {} as any);

        // 3. Get paginated promos and merge with stats
        const total = await PromoCode.countDocuments(query);
        const promos = await PromoCode.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        const promosWithStats = promos.map((promo) => {
            const financial = financialMap[promo.code] || {
                totalDiscount: 0,
                totalRevenue: 0,
            };

            return {
                ...promo,
                stats: {
                    totalDiscount: financial.totalDiscount,
                    totalRevenue: financial.totalRevenue,
                    isExpired: promo.expiryDate < now,
                },
            };
        });

        res.json({
            success: true,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            limit: limitNum,
            stats: globalStats[0] || {
                totalPromos: 0,
                usedPromos: 0,
                unusedPromos: 0,
                activePromos: 0,
                expiredPromos: 0,
            },
            data: promosWithStats,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get detailed usage of a promo code
// @route   GET /api/v1/promos/:id/usage
// @access  Private/Admin
export const getPromoUsage = async (req: Request, res: Response) => {
    const promo = await PromoCode.findById(req.params.id);

    if (!promo) {
        res.status(404).json({ message: 'Promo code not found' });
        return;
    }

    const usage = await Booking.find({ 'promo.code': promo.code })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .select('user createdAt totalPrice promo status');

    const formattedUsage = usage.map((b) => ({
        user: b.user,
        usedAt: (b as any).createdAt,
        bookingId: b._id,
        bookingStatus: b.status,
        bookingTotal: b.totalPrice,
        discountAmount: b.promo?.discountAmount,
    }));

    res.json({
        success: true,
        promoCode: promo.code,
        usage: formattedUsage,
    });
};

// @desc    Get single promo code
// @route   GET /api/v1/promos/:id
// @access  Private/Admin
export const getPromoCodeById = async (req: Request, res: Response) => {
    const promo = await PromoCode.findById(req.params.id).lean();

    if (promo) {
        // Get usage financial stats for this specific promo
        const usageFinancialStats = await Booking.aggregate([
            { $match: { 'promo.code': promo.code } },
            {
                $group: {
                    _id: '$promo.code',
                    totalDiscount: { $sum: '$promo.discountAmount' },
                    totalRevenue: { $sum: '$totalPrice' },
                },
            },
        ]);

        const financial = usageFinancialStats[0] || {
            totalDiscount: 0,
            totalRevenue: 0,
        };

        const now = new Date();

        res.json({
            ...promo,
            stats: {
                totalDiscount: financial.totalDiscount,
                totalRevenue: financial.totalRevenue,
                isExpired: promo.expiryDate < now,
            },
        });
    } else {
        res.status(404).json({ message: 'Promo code not found' });
    }
};

// @desc    Update promo code
// @route   PATCH /api/v1/promos/:id
// @access  Private/Admin
export const updatePromoCode = async (req: Request, res: Response) => {
    const { code, discountType, value, expiryDate, minOrderValue, isActive, maxUsage } = req.body;

    const promo = await PromoCode.findById(req.params.id);

    if (promo) {
        // If code is being changed, check if new code already exists
        if (code && code.toUpperCase() !== promo.code) {
            const promoExists = await PromoCode.findOne({ code: code.toUpperCase() });
            if (promoExists) {
                res.status(400).json({ message: 'New promo code already exists' });
                return;
            }
            promo.code = code.toUpperCase();
        }

        promo.discountType = discountType || promo.discountType;
        promo.value = value !== undefined ? value : promo.value;
        promo.expiryDate = expiryDate || promo.expiryDate;
        promo.minOrderValue = minOrderValue !== undefined ? minOrderValue : promo.minOrderValue;
        promo.isActive = isActive !== undefined ? isActive : promo.isActive;
        promo.maxUsage = maxUsage !== undefined ? maxUsage : promo.maxUsage;

        const updatedPromo = await promo.save();
        res.json(updatedPromo);
    } else {
        res.status(404).json({ message: 'Promo code not found' });
    }
};

// @desc    Validate and apply promo code
// @route   POST /api/v1/promos/apply
// @access  Private
export const applyPromoCode = async (req: Request, res: Response) => {
    const { code, orderTotal } = req.body;

    const promo = await PromoCode.findOne({ code, isActive: true });

    if (!promo) {
        res.status(404).json({ message: 'Invalid or inactive promo code' });
        return;
    }

    if (promo.expiryDate < new Date()) {
        res.status(400).json({ message: 'Promo code expired' });
        return;
    }

    if (promo.maxUsage && promo.usedCount >= promo.maxUsage) {
        res.status(400).json({ message: 'Promo code usage limit reached' });
        return;
    }

    if (promo.minOrderValue && orderTotal < promo.minOrderValue) {
        res.status(400).json({
            message: `Minimum order value of ${promo.minOrderValue} required`,
        });
        return;
    }

    let discountAmount = 0;
    if (promo.discountType === 'percentage') {
        discountAmount = (orderTotal * promo.value) / 100;
    } else {
        discountAmount = promo.value;
    }

    if (discountAmount > orderTotal) {
        discountAmount = orderTotal;
    }

    res.json({
        code: promo.code,
        discountAmount,
        finalTotal: orderTotal - discountAmount,
    });
};

// @desc    Delete promo code
// @route   DELETE /api/v1/promos/:id
// @access  Private/Admin
export const deletePromoCode = async (req: Request, res: Response) => {
    const promo = await PromoCode.findById(req.params.id);

    if (promo) {
        await promo.deleteOne();
        res.json({ message: 'Promo code removed' });
    } else {
        res.status(404).json({ message: 'Promo code not found' });
    }
};
