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
    pickupDropoffLocations?: {
        name: string;
        pickUpFee: number;
        dropOffFee: number;
    }[];
}

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
        pickupDropoffLocations: {
            type: [
                {
                    name: { type: String, required: true },
                    pickUpFee: { type: Number, default: 0 },
                    dropOffFee: { type: Number, default: 0 },
                },
            ],
            default: [
                { name: 'International Airport SSR', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Balaclava', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Beau Champ', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Bel ombre', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Belle Mare', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Curepipe', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Ebene/Trianon', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Flic en Flacq', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Grand Baie', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Grand Gaube', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Le Morne', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Mahebourg', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Pereybere', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Pointe aux Canonniers', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Pointe aux Piments', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Port louis', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Poste de Flacq', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Poste Lafayette', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Quatre Borne', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Rivière du Rempart', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Rivière Noir', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Rose Hill', pickUpFee: 0, dropOffFee: 0 },
                { name: 'Trou aux Biches', pickUpFee: 0, dropOffFee: 0 },
                { name: "Trou d'Eau Douce", pickUpFee: 0, dropOffFee: 0 },
                { name: 'Vacoas', pickUpFee: 0, dropOffFee: 0 },
            ],
        },
    },
    {
        timestamps: true,
    }
);

const Car = mongoose.model<ICar>('Car', carSchema);

export default Car;
