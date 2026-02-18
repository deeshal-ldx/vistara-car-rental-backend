import mongoose, { Document, Schema } from 'mongoose';

export interface IExtraService extends Document {
    name: string;
    description: string;
    price: number;
    type: 'per_day' | 'per_rental';
    maxPrice?: number; // Optional cap for per_day services
    icon?: string;
    isActive: boolean;
}

const extraServiceSchema = new Schema<IExtraService>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        type: {
            type: String,
            enum: ['per_day', 'per_rental'],
            required: true,
        },
        maxPrice: { type: Number },
        icon: { type: String },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

const ExtraService = mongoose.model<IExtraService>('ExtraService', extraServiceSchema);

export default ExtraService;
