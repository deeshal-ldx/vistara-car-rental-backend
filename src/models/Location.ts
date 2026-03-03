import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
    name: string;
    pickUpFee: number;
    dropOffFee: number;
    isActive: boolean;
}

const locationSchema = new Schema<ILocation>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        pickUpFee: {
            type: Number,
            default: 0,
        },
        dropOffFee: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Location = mongoose.model<ILocation>('Location', locationSchema);

export default Location;
