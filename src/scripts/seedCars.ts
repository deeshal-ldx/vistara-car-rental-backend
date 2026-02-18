import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Car from '../models/Car';
import connectDB from '../config/db';

dotenv.config();

const sampleCars = [
    {
        make: 'Toyota',
        carModel: 'Camry',
        year: 2024,
        type: 'Sedan',
        pricePerDay: 2500,
        location: 'Mauritius',
        isAvailable: true,
        images: [
            'https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1000',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?auto=format&fit=crop&q=80&w=1000',
        specs: {
            seats: 5,
            transmission: 'Automatic',
            fuelType: 'Gasoline',
            mileage: 'Unlimited',
            fuelPolicy: 'Full to Full',
            airConditioning: true,
        },
        features: ['GPS', 'Bluetooth', 'Reverse Camera'],
        description: 'Reliable and comfortable sedan for city and highway driving.',
    },
    {
        make: 'Honda',
        carModel: 'CR-V',
        year: 2023,
        type: 'SUV',
        pricePerDay: 3200,
        location: 'Mauritius',
        isAvailable: true,
        images: [
            'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&q=80&w=1000',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&q=80&w=1000',
        specs: {
            seats: 5,
            transmission: 'Automatic',
            fuelType: 'Hybrid',
            mileage: 'Limited',
            fuelPolicy: 'Same to Same',
            airConditioning: true,
        },
        features: ['All-Wheel Drive', 'Sunroof', 'Apple CarPlay'],
        description: 'Spacious SUV perfect for family trips.',
    },
    {
        make: 'Tesla',
        carModel: 'Model 3',
        year: 2024,
        type: 'Electric',
        pricePerDay: 4500,
        location: 'Mauritius',
        isAvailable: true,
        images: [
            'https://images.unsplash.com/photo-1536700503339-1e4b0652077e?auto=format&fit=crop&q=80&w=1000',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1536700503339-1e4b0652077e?auto=format&fit=crop&q=80&w=1000',
        specs: {
            seats: 5,
            transmission: 'Automatic',
            fuelType: 'Electric',
            mileage: 'Unlimited',
            fuelPolicy: 'Full to Full',
            airConditioning: true,
        },
        features: ['Autopilot', 'Supercharging', 'Premium Audio'],
        description: 'Experience the future of driving with this fully electric car.',
    },
    {
        make: 'Ford',
        carModel: 'Mustang',
        year: 2023,
        type: 'Convertible',
        pricePerDay: 5000,
        location: 'Mauritius',
        isAvailable: true,
        images: [
            'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1000',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1000',
        specs: {
            seats: 4,
            transmission: 'Automatic',
            fuelType: 'Gasoline',
            mileage: 'Limited',
            fuelPolicy: 'Full to Full',
            airConditioning: true,
        },
        features: ['Convertible Top', 'Sport Mode', 'Premium Sound'],
        description: 'Feel the wind in your hair with this iconic American muscle car.',
    },
    {
        make: 'BMW',
        carModel: 'X5',
        year: 2024,
        type: 'Luxury SUV',
        pricePerDay: 5500,
        location: 'Mauritius',
        isAvailable: true,
        images: [
            'https://images.unsplash.com/photo-1556189250-72ba954e9664?auto=format&fit=crop&q=80&w=1000',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1556189250-72ba954e9664?auto=format&fit=crop&q=80&w=1000',
        specs: {
            seats: 5,
            transmission: 'Automatic',
            fuelType: 'Gasoline',
            mileage: 'Unlimited',
            fuelPolicy: 'Full to Full',
            airConditioning: true,
        },
        features: ['Leather Seats', 'Panoramic Roof', 'Heated Seats'],
        description: 'Luxury and performance combined in this premium SUV.',
    },
    {
        make: 'Chevrolet',
        carModel: 'Suburban',
        year: 2023,
        type: 'Large SUV',
        pricePerDay: 4800,
        location: 'Mauritius',
        isAvailable: true,
        images: [
            'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=1000',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=1000',
        specs: {
            seats: 7,
            transmission: 'Automatic',
            fuelType: 'Gasoline',
            mileage: 'Unlimited',
            fuelPolicy: 'Full to Full',
            airConditioning: true,
        },
        features: ['3rd Row Seating', 'Entertainment System', 'Ample Cargo Space'],
        description: 'Perfect for large families and road trips.',
    },
    {
        make: 'Mercedes-Benz',
        carModel: 'C-Class',
        year: 2024,
        type: 'Luxury Sedan',
        pricePerDay: 5200,
        location: 'Mauritius',
        isAvailable: true,
        images: [
            'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1000',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1000',
        specs: {
            seats: 5,
            transmission: 'Automatic',
            fuelType: 'Gasoline',
            mileage: 'Limited',
            fuelPolicy: 'Full to Full',
            airConditioning: true,
        },
        features: ['Leather Interior', 'Ambient Lighting', 'Driver Assistance'],
        description: 'Sophisticated style and advanced technology.',
    },
    {
        make: 'Jeep',
        carModel: 'Wrangler',
        year: 2023,
        type: 'SUV',
        pricePerDay: 3800,
        location: 'Mauritius',
        isAvailable: true,
        images: [
            'https://images.unsplash.com/photo-1583121274602-3e2820c698d9?auto=format&fit=crop&q=80&w=1000',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1583121274602-3e2820c698d9?auto=format&fit=crop&q=80&w=1000',
        specs: {
            seats: 5,
            transmission: 'Automatic',
            fuelType: 'Gasoline',
            mileage: 'Unlimited',
            fuelPolicy: 'Full to Full',
            airConditioning: true,
        },
        features: ['4x4', 'Removable Top', 'Off-Road Tires'],
        description: 'Go anywhere with this rugged off-road icon.',
    },
    {
        make: 'Hyundai',
        carModel: 'Elantra',
        year: 2024,
        type: 'Sedan',
        pricePerDay: 2200,
        location: 'Mauritius',
        isAvailable: true,
        images: [
            'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=1000',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=1000',
        specs: {
            seats: 5,
            transmission: 'Automatic',
            fuelType: 'Gasoline',
            mileage: 'Unlimited',
            fuelPolicy: 'Full to Full',
            airConditioning: true,
        },
        features: ['Fuel Efficient', 'Apple CarPlay', 'Lane Keep Assist'],
        description: 'Economical and reliable choice for everyday driving.',
    },
    {
        make: 'Audi',
        carModel: 'A4',
        year: 2024,
        type: 'Luxury Sedan',
        pricePerDay: 4300,
        location: 'Mauritius',
        isAvailable: true,
        images: [
            'https://images.unsplash.com/photo-1606152421802-db71041893cd?auto=format&fit=crop&q=80&w=1000',
        ],
        featuredImage: 'https://images.unsplash.com/photo-1606152421802-db71041893cd?auto=format&fit=crop&q=80&w=1000',
        specs: {
            seats: 5,
            transmission: 'Automatic',
            fuelType: 'Gasoline',
            mileage: 'Limited',
            fuelPolicy: 'Full to Full',
            airConditioning: true,
        },
        features: ['Virtual Cockpit', 'Quattro AWD', 'Leather Seats'],
        description: 'Performance and technology in a sleek package.',
    },
];

const importData = async () => {
    try {
        await connectDB();

        await Car.deleteMany();

        await Car.insertMany(sampleCars);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connectDB();

        await Car.deleteMany();

        console.log('Data Destroyed!');
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
