import mongoose, { Document, Schema } from 'mongoose';

export interface IPromoCode extends Document {
    code: string;
    discountType: 'percentage' | 'fixed';
    value: number;
    expiryDate: Date;
    minOrderValue?: number;
    isActive: boolean;
    maxUsage?: number;
    usedCount: number;
}

const promoCodeSchema = new Schema<IPromoCode>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            required: true,
        },
        value: {
            type: Number,
            required: true,
        },
        expiryDate: {
            type: Date,
            required: true,
        },
        minOrderValue: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        maxUsage: {
            type: Number,
            default: 0,
        },
        usedCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const PromoCode = mongoose.model<IPromoCode>('PromoCode', promoCodeSchema);

export default PromoCode;
