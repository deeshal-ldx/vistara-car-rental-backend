import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import connectDB from '../config/db';

dotenv.config();

const adminUser = {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin@12345',
    role: 'admin' as const,
};

const importData = async () => {
    try {
        await connectDB();

        const existingAdmin = await User.findOne({ email: adminUser.email });

        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit();
        }

        await User.create(adminUser);

        console.log('Admin user created!');
        console.log(`Email: ${adminUser.email}`);
        console.log(`Password: ${adminUser.password}`);
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();

