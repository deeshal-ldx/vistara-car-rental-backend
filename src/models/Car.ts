import mongoose, { Document, Schema } from 'mongoose';

export interface ICar extends Document {
    make: string;
    carModel: string;
    year: number;
    type: string;
    pricePerDay: number;
    currency: 'MUR';
    location: string;
    isAvailable: boolean;
    images: string[];
    featuredImage: string;
    specs: {
        seats: number;
        transmission: 'Automatic' | 'Manual';
        fuelType: 'Diesel' | 'Gasoline' | 'Electric' | 'Hybrid';
        mileage: 'Limited' | 'Unlimited';
        fuelPolicy: 'Same to Same' | 'Full to Full';
        airConditioning: boolean;
    };
    features: string[];
    description?: string;
    airportTransferPrice?: {
        oneWay: number;
        twoWay: number;
    };
    pickupDropoffLocations?: {
        name: string;
        pickUpFee: number;
        dropOffFee: number;
    }[];
}

const basePickupDropoffLocations = [
    'International Airport SSR',
    'Balaclava',
    'Beau Champ',
    'Bel ombre',
    'Belle Mare',
    'Curepipe',
    'Ebene/Trianon',
    'Flic en Flacq',
    'Grand Baie',
    'Grand Gaube',
    'Le Morne',
    'Mahebourg',
    'Pereybere',
    'Pointe aux Canonniers',
    'Pointe aux Piments',
    'Port louis',
    'Poste de Flacq',
    'Poste Lafayette',
    'Quatre Borne',
    'Rivière du Rempart',
    'Rivière Noir',
    'Rose Hill',
    'Trou aux Biches',
    "Trou d'Eau Douce",
    'Vacoas',
];

const randomFee = () => Math.floor(Math.random() * 401) + 100;

const carSchema = new Schema<ICar>(
    {
        make: { type: String, required: true },
        carModel: { type: String, required: true },
        year: { type: Number, required: true },
        type: { type: String, required: true },
        pricePerDay: { type: Number, required: true },
        currency: { type: String, default: 'MUR' },
        location: { type: String, required: true },
        isAvailable: { type: Boolean, default: true },
        images: [{ type: String }],
        featuredImage: { type: String, required: true },
        specs: {
            seats: { type: Number, required: true },
            transmission: { type: String, enum: ['Automatic', 'Manual'], required: true },
            fuelType: {
                type: String,
                enum: ['Diesel', 'Gasoline', 'Electric', 'Hybrid'],
                required: true,
            },
            mileage: { type: String, enum: ['Limited', 'Unlimited'], required: true },
            fuelPolicy: { type: String, enum: ['Same to Same', 'Full to Full'], required: true },
            airConditioning: { type: Boolean, default: true },
        },
        features: [{ type: String }],
        description: { type: String },
        airportTransferPrice: {
            oneWay: { type: Number, default: 0 },
            twoWay: { type: Number, default: 0 },
        },
        pickupDropoffLocations: {
            type: [
                {
                    name: { type: String, required: true },
                    pickUpFee: { type: Number, default: 0 },
                    dropOffFee: { type: Number, default: 0 },
                },
            ],
            default: () =>
                basePickupDropoffLocations.map((name) => ({
                    name,
                    pickUpFee: randomFee(),
                    dropOffFee: randomFee(),
                })),
        },
    },
    {
        timestamps: true,
    }
);

const Car = mongoose.model<ICar>('Car', carSchema);

export default Car;
