import { Request, Response } from 'express';
import ExtraService from '../models/ExtraService';

// @desc    Get all extra services
// @route   GET /api/v1/extras
// @access  Public
export const getExtraServices = async (req: Request, res: Response) => {
    const extras = await ExtraService.find({ isActive: true });
    res.json(extras);
};

// @desc    Create extra service
// @route   POST /api/v1/extras
// @access  Private/Admin
export const createExtraService = async (req: Request, res: Response) => {
    const { name, description, price, type, maxPrice, icon, isActive } = req.body;

    const extraService = await ExtraService.create({
        name,
        description,
        price,
        type,
        maxPrice,
        icon,
        isActive,
    });

    res.status(201).json(extraService);
};

// @desc    Update extra service
// @route   PUT /api/v1/extras/:id
// @access  Private/Admin
export const updateExtraService = async (req: Request, res: Response) => {
    const { name, description, price, type, maxPrice, icon, isActive } = req.body;

    const extraService = await ExtraService.findById(req.params.id);

    if (extraService) {
        extraService.name = name || extraService.name;
        extraService.description = description || extraService.description;
        extraService.price = price !== undefined ? price : extraService.price;
        extraService.type = type || extraService.type;
        extraService.maxPrice = maxPrice !== undefined ? maxPrice : extraService.maxPrice;
        extraService.icon = icon || extraService.icon;
        extraService.isActive = isActive !== undefined ? isActive : extraService.isActive;

        const updatedExtraService = await extraService.save();
        res.json(updatedExtraService);
    } else {
        res.status(404).json({ message: 'Extra service not found' });
    }
};

// @desc    Delete extra service
// @route   DELETE /api/v1/extras/:id
// @access  Private/Admin
export const deleteExtraService = async (req: Request, res: Response) => {
    const extraService = await ExtraService.findById(req.params.id);

    if (extraService) {
        await extraService.deleteOne();
        res.json({ message: 'Extra service removed' });
    } else {
        res.status(404).json({ message: 'Extra service not found' });
    }
};
