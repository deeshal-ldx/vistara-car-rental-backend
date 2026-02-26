import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import Booking from '../models/Booking';
import Car from '../models/Car';
import ExtraService from '../models/ExtraService';
import ProtectionPlan from '../models/ProtectionPlan';
import PromoCode from '../models/PromoCode';

// @desc    Create new booking
// @route   POST /api/v1/bookings
// @access  Private
export const createBooking = async (req: Request, res: Response): Promise<void> => {
    const {
        carId,
        startDate,
        endDate,
        paymentMethod,
        driverDetails,
        pickupLocation,
        dropoffLocation,
        extraServices, // Array of { serviceId, quantity }
        protectionPlanId,
        promoCode,
        bookingType, // 'rental' or 'airport_transfer'
        airportTransferDetails,
    } = req.body;

    const car = await Car.findById(carId);

    if (!car) {
        res.status(404).json({ message: 'Car not found' });
        return;
    }

    // Calculate days using Luxon in UTC to avoid timezone issues
    const start = DateTime.fromISO(startDate, { zone: 'UTC' }).startOf('day');
    const end = DateTime.fromISO(endDate, { zone: 'UTC' }).startOf('day');

    if (!start.isValid || !end.isValid) {
        res.status(400).json({ message: 'Invalid booking dates' });
        return;
    }

    const diffDays = end.diff(start, 'days').days;

    if (diffDays < 3 && (!bookingType || bookingType === 'rental')) {
        res.status(400).json({ message: 'Minimum booking duration is 3 days' });
        return;
    }

    // Calculate car price
    let carTotal = 0;
    const isTransfer = bookingType === 'airport_transfer';

    if (isTransfer) {
        if (
            !airportTransferDetails ||
            !airportTransferDetails.transferType ||
            !airportTransferDetails.customerName ||
            !airportTransferDetails.customerEmail ||
            !airportTransferDetails.customerPhone
        ) {
            res.status(400).json({
                message: 'Airport transfer details (type, name, email, phone) are required',
            });
            return;
        }

        const transferPrice = car.airportTransferPrice;
        if (!transferPrice) {
            res.status(400).json({ message: 'This car does not support airport transfers' });
            return;
        }

        carTotal =
            airportTransferDetails.transferType === 'one_way'
                ? transferPrice.oneWay
                : transferPrice.twoWay;
    } else {
        carTotal = Math.round(diffDays) * car.pricePerDay;
    }

    let extrasTotal = 0;
    let protectionPlanTotal = 0;
    let promoDiscountTotal = 0;
    let pickupDropoffTotal = 0;
    let processedExtras = [];
    let processedProtectionPlan: any = null;
    let processedPromo: any = null;
    let pickupDropoffFees: any = null;

    // Calculate extra services price
    if (extraServices && extraServices.length > 0) {
        for (const item of extraServices) {
            const extra = await ExtraService.findById(item.serviceId);
            if (extra) {
                let itemTotal = 0;
                if (extra.type === 'per_day') {
                    // Calculate daily cost
                    let dailyCost = extra.price * item.quantity * diffDays;
                    // Apply cap if exists
                    if (extra.maxPrice && dailyCost > extra.maxPrice) {
                        dailyCost = extra.maxPrice;
                    }
                    itemTotal = dailyCost;
                } else {
                    // Fixed price per rental
                    itemTotal = extra.price * item.quantity;
                }

                extrasTotal += itemTotal;
                processedExtras.push({
                    service: extra._id,
                    quantity: item.quantity,
                    priceAtBooking: extra.price,
                    total: itemTotal,
                });
            }
        }
    }

    if (protectionPlanId) {
        const plan = await ProtectionPlan.findById(protectionPlanId);

        if (!plan) {
            res.status(400).json({ message: 'Protection plan not found' });
            return;
        }

        if (plan.type === 'per_day') {
            protectionPlanTotal = plan.price * Math.round(diffDays);
        } else {
            protectionPlanTotal = plan.price;
        }

        processedProtectionPlan = {
            plan: plan._id,
            priceAtBooking: plan.price,
            type: plan.type,
            total: protectionPlanTotal,
        };
    }

    if ((pickupLocation || dropoffLocation) && !isTransfer) {
        const locations = car.pickupDropoffLocations || [];

        let pickUpFee = 0;
        let dropOffFee = 0;

        if (pickupLocation) {
            const pickupEntry = locations.find((l) => l.name === pickupLocation);
            if (pickupEntry) {
                pickUpFee = pickupEntry.pickUpFee || 0;
            }
        }

        if (dropoffLocation) {
            const dropoffEntry = locations.find((l) => l.name === dropoffLocation);
            if (dropoffEntry) {
                dropOffFee = dropoffEntry.dropOffFee || 0;
            }
        }

        pickupDropoffTotal = pickUpFee + dropOffFee;

        pickupDropoffFees = {
            pickupLocation,
            dropoffLocation,
            pickUpFee,
            dropOffFee,
            total: pickupDropoffTotal,
        };
    }

    const subtotalBeforePromo = carTotal + extrasTotal + protectionPlanTotal + pickupDropoffTotal;

    if (promoCode) {
        const promo = await PromoCode.findOne({
            code: (promoCode as string).toUpperCase(),
            isActive: true,
        });

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

        if (promo.minOrderValue && subtotalBeforePromo < promo.minOrderValue) {
            res.status(400).json({
                message: `Minimum order value of ${promo.minOrderValue} required`,
            });
            return;
        }

        let discountAmount = 0;
        if (promo.discountType === 'percentage') {
            discountAmount = (subtotalBeforePromo * promo.value) / 100;
        } else {
            discountAmount = promo.value;
        }

        if (discountAmount > subtotalBeforePromo) {
            discountAmount = subtotalBeforePromo;
        }

        promoDiscountTotal = discountAmount;

        promo.usedCount += 1;
        await promo.save();

        processedPromo = {
            code: promo.code,
            discountType: promo.discountType,
            value: promo.value,
            minOrderValue: promo.minOrderValue,
            discountAmount,
        };
    }

    let totalPrice = subtotalBeforePromo - promoDiscountTotal;

    const booking = new Booking({
        user: (req.user as any)._id,
        car: carId,
        startDate,
        endDate,
        totalPrice,
        paymentMethod,
        driverDetails,
        pickupLocation,
        dropoffLocation,
        extraServices: processedExtras,
        protectionPlan: processedProtectionPlan,
        promo: processedPromo,
        pickupDropoffFees,
        bookingType: bookingType || 'rental',
        airportTransferDetails: isTransfer ? airportTransferDetails : undefined,
        paymentStatus: 'pending',
        status: 'pending',
    });

    const createdBooking = await booking.save();
    res.status(201).json(createdBooking);
};

// @desc    Get all bookings with filters and pagination
// @route   GET /api/v1/bookings
// @access  Private (Admin: all, User: theirs)
export const getBookings = async (req: Request, res: Response) => {
    const {
        status,
        paymentStatus,
        carId,
        userId,
        pickupLocation,
        dropoffLocation,
        startDateFrom,
        startDateTo,
        bookingDate, // Specific date to check active bookings
        bookingType,
        search,
        page = '1',
        limit = '10',
        sortBy,
        sortOrder,
    } = req.query as {
        status?: string;
        paymentStatus?: string;
        carId?: string;
        userId?: string;
        pickupLocation?: string;
        dropoffLocation?: string;
        startDateFrom?: string;
        startDateTo?: string;
        bookingDate?: string;
        bookingType?: string;
        search?: string;
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
    };

    const pageNum = Math.max(parseInt(page || '1', 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit || '10', 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const baseQuery: any = {};

    if (req.user?.role === 'admin') {
        if (userId) {
            baseQuery.user = userId;
        }
    } else {
        baseQuery.user = (req.user as any)._id;
    }

    if (status) {
        const parts = status.split(',').map((s) => s.trim());
        baseQuery.status = parts.length > 1 ? { $in: parts } : parts[0];
    }

    if (paymentStatus) {
        const parts = paymentStatus.split(',').map((s) => s.trim());
        baseQuery.paymentStatus = parts.length > 1 ? { $in: parts } : parts[0];
    }

    if (carId) {
        baseQuery.car = carId;
    }

    if (bookingType) {
        baseQuery.bookingType = bookingType;
    }

    if (pickupLocation) {
        baseQuery.pickupLocation = { $regex: pickupLocation, $options: 'i' };
    }

    if (dropoffLocation) {
        baseQuery.dropoffLocation = { $regex: dropoffLocation, $options: 'i' };
    }

    if (bookingDate) {
        const date = DateTime.fromISO(bookingDate, { zone: 'UTC' }).startOf('day').toJSDate();
        if (!isNaN(date.getTime())) {
            baseQuery.startDate = { $lte: date };
            baseQuery.endDate = { $gte: date };
        }
    } else if (startDateFrom || startDateTo) {
        baseQuery.startDate = {};
        if (startDateFrom) {
            const from = DateTime.fromISO(startDateFrom, { zone: 'UTC' }).startOf('day').toJSDate();
            if (!isNaN(from.getTime())) {
                baseQuery.startDate.$gte = from;
            }
        }
        if (startDateTo) {
            const to = DateTime.fromISO(startDateTo, { zone: 'UTC' }).endOf('day').toJSDate();
            if (!isNaN(to.getTime())) {
                baseQuery.startDate.$lte = to;
            }
        }
        if (Object.keys(baseQuery.startDate).length === 0) {
            delete baseQuery.startDate;
        }
    }

    const andConditions: any[] = [baseQuery];

    if (search) {
        const regex = new RegExp(search, 'i');
        andConditions.push({
            $or: [
                { 'driverDetails.name': regex },
                { pickupLocation: regex },
                { dropoffLocation: regex },
                { 'promo.code': regex },
            ],
        });
    }

    const finalQuery = andConditions.length > 1 ? { $and: andConditions } : baseQuery;

    const sortField = sortBy || 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortDir };

    const total = await Booking.countDocuments(finalQuery);

    // Calculate statistics for the filtered set
    const stats = await Booking.aggregate([
        { $match: finalQuery },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$totalPrice' },
                pendingCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
                },
                confirmedCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
                },
                completedCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
                cancelledCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
                },
                paidRevenue: {
                    $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalPrice', 0] },
                },
            },
        },
    ]);

    const query = Booking.find(finalQuery)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email')
        .populate('car', 'make carModel')
        .populate('extraServices.service', 'name')
        .populate('protectionPlan.plan', 'name type price');

    const bookings = await query.exec();

    res.json({
        success: true,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
        stats: stats[0] || {
            totalRevenue: 0,
            pendingCount: 0,
            confirmedCount: 0,
            completedCount: 0,
            cancelledCount: 0,
            paidRevenue: 0,
        },
        data: bookings,
    });
};

// @desc    Get booking by ID
// @route   GET /api/v1/bookings/:id
// @access  Private
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
    const booking = await Booking.findById(req.params.id)
        .populate('user', 'name email')
        .populate('car', 'make carModel images location')
        .populate('extraServices.service', 'name description type')
        .populate('protectionPlan.plan', 'name type price');

    if (booking) {
       
        if (
            req.user?.role !== 'admin' &&
            (booking.user as any)._id.toString() !== (req.user as any)._id.toString()
        ) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }
        res.json(booking);
    } else {
        res.status(404).json({ message: 'Booking not found' });
    }
};

// @desc    Update booking status
// @route   PUT /api/v1/bookings/:id/status
// @access  Private/Admin
export const updateBookingStatus = async (req: Request, res: Response) => {
    const { status, paymentStatus } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (booking) {
        booking.status = status || booking.status;
        booking.paymentStatus = paymentStatus || booking.paymentStatus;

        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } else {
        res.status(404).json({ message: 'Booking not found' });
    }
};

export const getUserCurrentBookings = async (req: Request, res: Response) => {
    const now = DateTime.utc().startOf('day').toJSDate();

    const bookings = await Booking.find({
        user: (req.user as any)._id,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            { startDate: { $gte: now } },
            { startDate: { $lte: now }, endDate: { $gte: now } },
        ],
    })
        .sort({ startDate: 1 })
        .populate('car', 'make carModel images location')
        .populate('extraServices.service', 'name')
        .populate('protectionPlan.plan', 'name type price');

    res.json(bookings);
};

export const getUserPastBookings = async (req: Request, res: Response) => {
    const now = DateTime.utc().startOf('day').toJSDate();

    const bookings = await Booking.find({
        user: (req.user as any)._id,
        $or: [
            { endDate: { $lt: now } },
            { status: { $in: ['completed', 'cancelled'] } },
        ],
    })
        .sort({ startDate: -1 })
        .populate('car', 'make carModel images location')
        .populate('extraServices.service', 'name')
        .populate('protectionPlan.plan', 'name type price');

    res.json(bookings);
};

export const getUserBookingDetails = async (req: Request, res: Response): Promise<void> => {
    const booking = await Booking.findOne({
        _id: req.params.id,
        user: (req.user as any)._id,
    })
        .populate('user', 'name email')
        .populate('car', 'make carModel images location')
        .populate('extraServices.service', 'name description type')
        .populate('protectionPlan.plan', 'name type price');

    if (!booking) {
        res.status(404).json({ message: 'Booking not found' });
        return;
    }

    res.json(booking);
};
