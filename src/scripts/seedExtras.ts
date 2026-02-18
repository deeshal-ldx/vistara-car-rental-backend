import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ExtraService from '../models/ExtraService';
import connectDB from '../config/db';

dotenv.config();

const sampleExtras = [
    {
        name: 'Accident Protection - Full Coverage',
        description: 'Reduce your liability to zero. Fully refundable if no damage. Recommended for peace of mind.',
        price: 10.00,
        type: 'per_day',
        maxPrice: 150.00,
        icon: 'https://cdn-icons-png.flaticon.com/512/2966/2966334.png', // Shield icon
        isActive: true,
    },
    {
        name: 'Baby Seat',
        description: 'Suitable for baby 0-13 Kg. Meets EU Safety Standards.',
        price: 5.00,
        type: 'per_day',
        maxPrice: 30.00,
        icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png', // Baby seat icon
        isActive: true,
    },
    {
        name: 'Booster Seat',
        description: 'Suitable for children 7-12 years old. Designed for comfort and safety.',
        price: 5.00,
        type: 'per_day',
        maxPrice: 30.00,
        icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png', // Booster seat (reused icon)
        isActive: true,
    },
    {
        name: 'Child Seat',
        description: 'Suitable for child 9-18 Kg. Secure and comfortable for young passengers.',
        price: 5.00,
        type: 'per_day',
        maxPrice: 30.00,
        icon: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png', // Child seat (reused icon)
        isActive: true,
    },
    {
        name: 'SIM Card',
        description: 'Enjoy 5G Data into your Mobile Phone and get Internet Package including Unlimited Internet valid for 30 days.',
        price: 30.00,
        type: 'per_rental',
        icon: 'https://cdn-icons-png.flaticon.com/512/644/644458.png', // SIM card icon
        isActive: true,
    },
    {
        name: 'GPS Navigation',
        description: 'Never get lost with our updated GPS navigation systems.',
        price: 8.00,
        type: 'per_day',
        maxPrice: 80.00,
        icon: 'https://cdn-icons-png.flaticon.com/512/854/854878.png', // GPS icon
        isActive: true,
    },
    {
        name: 'Additional Driver',
        description: 'Share the driving responsibilities with an additional authorized driver.',
        price: 12.00,
        type: 'per_day',
        maxPrice: 120.00,
        icon: 'https://cdn-icons-png.flaticon.com/512/1256/1256650.png', // Driver icon
        isActive: true,
    }
];

const importData = async () => {
    try {
        await connectDB();

        await ExtraService.deleteMany();

        await ExtraService.insertMany(sampleExtras);

        console.log('Extra Services Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();

        await ExtraService.deleteMany();

        console.log('Extra Services Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
