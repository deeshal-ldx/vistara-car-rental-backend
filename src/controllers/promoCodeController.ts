import { Request, Response } from 'express';
import PromoCode from '../models/PromoCode';

// @desc    Create promo code
// @route   POST /api/v1/promos
// @access  Private/Admin
export const createPromoCode = async (req: Request, res: Response) => {
    const { code, discountType, value, expiryDate, minOrderValue, isActive } = req.body;

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
    });

    res.status(201).json(promoCode);
};

// @desc    Get all promo codes
// @route   GET /api/v1/promos
// @access  Private/Admin
export const getPromoCodes = async (req: Request, res: Response) => {
    const promos = await PromoCode.find({});
    res.json(promos);
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
