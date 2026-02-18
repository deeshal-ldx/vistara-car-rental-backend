import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProtectionPlan from '../models/ProtectionPlan';
import connectDB from '../config/db';

dotenv.config();

const sampleProtectionPlans = [
    {
        name: 'Standard Protection Plan',
        subtitle: 'Refundable Deposit',
        features: [
            'Pay a refundable deposit of Rs 15,000',
            'Fully refundable if the vehicle is returned without damage',
        ],
        price: 1500,
        type: 'flat',
        isActive: true,
    },
    {
        name: 'Premium Protection Plan',
        subtitle: 'Daily Insurance Fee',
        features: ['Pay Rs 500/day', 'No deposit required'],
        price: 500,
        type: 'per_day',
        isActive: true,
    },
];

const importData = async () => {
    try {
        await connectDB();

        await ProtectionPlan.deleteMany();

        await ProtectionPlan.insertMany(sampleProtectionPlans);

        console.log('Protection Plans Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();

        await ProtectionPlan.deleteMany();

        console.log('Protection Plans Destroyed!');
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

