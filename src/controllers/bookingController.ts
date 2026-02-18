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

    if (diffDays < 3) {
        res.status(400).json({ message: 'Minimum booking duration is 3 days' });
        return;
    }

    // Calculate car price
    let carTotal = Math.round(diffDays) * car.pricePerDay;
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

    if (pickupLocation || dropoffLocation) {
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
        paymentStatus: 'pending',
        status: 'pending',
    });

    const createdBooking = await booking.save();
    res.status(201).json(createdBooking);
};

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private (Admin: all, User: theirs)
export const getBookings = async (req: Request, res: Response) => {
    let bookings;

    if (req.user?.role === 'admin') {
        bookings = await Booking.find({})
            .populate('user', 'name email')
            .populate('car', 'make carModel')
            .populate('extraServices.service', 'name')
            .populate('protectionPlan.plan', 'name type price');
    } else {
        bookings = await Booking.find({ user: (req.user as any)._id })
            .populate('car', 'make carModel')
            .populate('extraServices.service', 'name')
            .populate('protectionPlan.plan', 'name type price');
    }

    res.json(bookings);
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
        // Check if admin or owner
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
