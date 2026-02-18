import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import Car from '../models/Car';
import Booking from '../models/Booking';

// @desc    Get all cars with advanced filters
// @route   GET /api/v1/cars
// @access  Public
export const getCars = async (req: Request, res: Response) => {
    const {
        location,
        minPrice,
        maxPrice,
        type,
        startDate,
        endDate,
        transmission,
        fuelType,
        seats,
        mileage,
        fuelPolicy,
        features,
        pickupLocation,
        dropoffLocation,
    } = req.query;

    let query: any = { isAvailable: true };

    // Location filter (Case insensitive)
    if (location) {
        query.location = { $regex: location, $options: 'i' };
    }

    // Car Type filter
    if (type) {
        query.type = { $regex: type, $options: 'i' };
    }

    // Price Range filter
    if (minPrice || maxPrice) {
        query.pricePerDay = {};
        if (minPrice) query.pricePerDay.$gte = Number(minPrice);
        if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }

    // Specifications Filters
    if (transmission) {
        query['specs.transmission'] = transmission;
    }

    if (fuelType) {
        query['specs.fuelType'] = fuelType;
    }

    if (seats) {
        query['specs.seats'] = { $gte: Number(seats) };
    }

    if (mileage) {
        query['specs.mileage'] = mileage;
    }

    if (fuelPolicy) {
        query['specs.fuelPolicy'] = fuelPolicy;
    }

    // Features filter (matches if car has ALL requested features)
    if (features) {
        const featuresList = (features as string).split(',');
        query.features = { $all: featuresList };
    }

    // Pickup/Dropoff location filter based on pickupDropoffLocations array
    const pickupDropoffConditions: any[] = [];

    if (pickupLocation) {
        pickupDropoffConditions.push({
            pickupDropoffLocations: { $elemMatch: { name: pickupLocation } },
        });
    }

    if (dropoffLocation) {
        pickupDropoffConditions.push({
            pickupDropoffLocations: { $elemMatch: { name: dropoffLocation } },
        });
    }

    // Date Availability Filter
    if (startDate && endDate) {
        try {
            const startDateTime = DateTime.fromISO(startDate as string, {
                zone: 'UTC',
            }).startOf('day');
            const endDateTime = DateTime.fromISO(endDate as string, {
                zone: 'UTC',
            }).endOf('day');

            if (!startDateTime.isValid || !endDateTime.isValid) {
                throw new Error('Invalid date format');
            }

            // Find bookings that overlap with requested dates
            // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
            const conflictingBookings = await Booking.find({
                status: { $in: ['confirmed', 'pending', 'completed'] }, // Exclude cancelled
                startDate: { $lte: endDateTime.toJSDate() },
                endDate: { $gte: startDateTime.toJSDate() },
            }).select('car');

            const bookedCarIds = conflictingBookings.map((b) => b.car);

            // Exclude cars that are booked
            if (bookedCarIds.length > 0) {
                query._id = { $nin: bookedCarIds };
            }
        } catch (error) {
            console.error('Date parsing error', error);
            res.status(400).json({ message: 'Invalid date format' });
            return;
        }
    }

    try {
        const mongoQuery =
            pickupDropoffConditions.length > 0
                ? { $and: [query, ...pickupDropoffConditions] }
                : query;

        const cars = await Car.find(mongoQuery);
        res.json({ success: true, count: cars.length, data: cars });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single car
// @route   GET /api/v1/cars/:id
// @access  Public
export const getCarById = async (req: Request, res: Response) => {
    const car = await Car.findById(req.params.id);

    if (car) {
        res.json(car);
    } else {
        res.status(404).json({ message: 'Car not found' });
    }
};

// @desc    Create a car
// @route   POST /api/v1/cars
// @access  Private/Admin
export const createCar = async (req: Request, res: Response) => {
    const {
        make,
        carModel,
        year,
        type,
        pricePerDay,
        currency,
        location,
        isAvailable,
        images,
        featuredImage, // Add featuredImage
        specs, // Add specs
        features,
        description,
        pickupDropoffLocations,
    } = req.body;

    const car = new Car({
        make,
        carModel,
        year,
        type,
        pricePerDay,
        currency,
        location,
        isAvailable,
        images,
        featuredImage,
        specs,
        features,
        description,
        pickupDropoffLocations,
    });

    const createdCar = await car.save();
    res.status(201).json(createdCar);
};

// @desc    Update a car
// @route   PUT /api/v1/cars/:id
// @access  Private/Admin
export const updateCar = async (req: Request, res: Response) => {
    const {
        make,
        carModel,
        year,
        type,
        pricePerDay,
        currency,
        location,
        isAvailable,
        images,
        featuredImage,
        specs, // Add specs
        features,
        description,
        pickupDropoffLocations,
    } = req.body;

    const car = await Car.findById(req.params.id);

    if (car) {
        car.make = make || car.make;
        car.carModel = carModel || car.carModel;
        car.year = year || car.year;
        car.type = type || car.type;
        car.pricePerDay = pricePerDay || car.pricePerDay;
        car.currency = currency || car.currency;
        car.location = location || car.location;
        car.isAvailable = isAvailable !== undefined ? isAvailable : car.isAvailable;
        car.images = images || car.images;
        car.featuredImage = featuredImage || car.featuredImage;
        car.specs = specs || car.specs;
        car.features = features || car.features;
        car.description = description || car.description;
        car.pickupDropoffLocations =
            pickupDropoffLocations || car.pickupDropoffLocations;

        const updatedCar = await car.save();
        res.json(updatedCar);
    } else {
        res.status(404).json({ message: 'Car not found' });
    }
};

// @desc    Delete a car
// @route   DELETE /api/v1/cars/:id
// @access  Private/Admin
export const deleteCar = async (req: Request, res: Response) => {
    const car = await Car.findById(req.params.id);

    if (car) {
        await car.deleteOne();
        res.json({ message: 'Car removed' });
    } else {
        res.status(404).json({ message: 'Car not found' });
    }
};
