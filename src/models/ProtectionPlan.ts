import mongoose, { Document, Schema } from 'mongoose';

export interface IProtectionPlan extends Document {
    name: string;
    subtitle: string;
    features: string[];
    price: number;
    type: 'flat' | 'per_day';
    isActive: boolean;
}

const protectionPlanSchema = new Schema<IProtectionPlan>(
    {
        name: { type: String, required: true },
        subtitle: { type: String, required: true },
        features: [{ type: String, required: true }],
        price: { type: Number, required: true },
        type: {
            type: String,
            enum: ['flat', 'per_day'],
            required: true,
        },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

const ProtectionPlan = mongoose.model<IProtectionPlan>('ProtectionPlan', protectionPlanSchema);

export default ProtectionPlan;

