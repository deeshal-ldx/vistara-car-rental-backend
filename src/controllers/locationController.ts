import { Request, Response } from 'express';
import Location from '../models/Location';

// @desc    Get all locations with pagination
// @route   GET /api/v1/locations
// @access  Public
export const getLocations = async (req: Request, res: Response) => {
    try {
        const {
            isActive,
            search,
            page = '1',
            limit = '10',
        } = req.query as {
            isActive?: string;
            search?: string;
            page?: string;
            limit?: string;
        };

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
        const skip = (pageNum - 1) * limitNum;

        const query: any = {};

        if (isActive === 'true') {
            query.isActive = true;
        } else if (isActive === 'false') {
            query.isActive = false;
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const total = await Location.countDocuments(query);
        const locations = await Location.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitNum);

        res.json({
            success: true,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            limit: limitNum,
            data: locations,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getSearchAbleLocations = async (req: Request, res: Response) => {
    try {
        
        const locations = await Location.find({isActive: true})

        res.json({
            success: true,
            data: locations.map(loc => loc?.name),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single location
// @route   GET /api/v1/locations/:id
// @access  Public
export const getLocationById = async (req: Request, res: Response) => {
    try {
        const location = await Location.findById(req.params.id);
        if (location) {
            res.json({ success: true, data: location });
        } else {
            res.status(404).json({ message: 'Location not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a location
// @route   POST /api/v1/locations
// @access  Private/Admin
export const createLocation = async (req: Request, res: Response) => {
    try {
        const { name, pickUpFee, dropOffFee, isActive } = req.body;

        const locationExists = await Location.findOne({ name });
        if (locationExists) {
            res.status(400).json({ message: 'Location already exists' });
            return;
        }

        const location = await Location.create({
            name,
            pickUpFee,
            dropOffFee,
            isActive,
        });

        res.status(201).json({ success: true, data: location });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a location
// @route   PATCH /api/v1/locations/:id
// @access  Private/Admin
export const updateLocation = async (req: Request, res: Response) => {
    try {
        const { name, pickUpFee, dropOffFee, isActive } = req.body;

        const location = await Location.findById(req.params.id);

        if (location) {
            if (name && name !== location.name) {
                const nameExists = await Location.findOne({ name });
                if (nameExists) {
                    res.status(400).json({ message: 'Location name already exists' });
                    return;
                }
                location.name = name;
            }

            location.pickUpFee = pickUpFee !== undefined ? pickUpFee : location.pickUpFee;
            location.dropOffFee = dropOffFee !== undefined ? dropOffFee : location.dropOffFee;
            location.isActive = isActive !== undefined ? isActive : location.isActive;

            const updatedLocation = await location.save();
            res.json({ success: true, data: updatedLocation });
        } else {
            res.status(404).json({ message: 'Location not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a location
// @route   DELETE /api/v1/locations/:id
// @access  Private/Admin
export const deleteLocation = async (req: Request, res: Response) => {
    try {
        const location = await Location.findById(req.params.id);

        if (location) {
            await location.deleteOne();
            res.json({ success: true, message: 'Location removed' });
        } else {
            res.status(404).json({ message: 'Location not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
