import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
    fullName: string;
    email: string;
    message: string;
    isAgreed: boolean;
    status: 'new' | 'contacted' | 'resolved' | 'ignored';
    source?: string;
}

const leadSchema = new Schema<ILead>(
    {
        fullName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        isAgreed: {
            type: Boolean,
            required: true,
        },
        status: {
            type: String,
            enum: ['new', 'contacted', 'resolved', 'ignored'],
            default: 'new',
        },
        source: {
            type: String,
            default: 'contact_us_form',
        },
    },
    {
        timestamps: true,
    }
);

const Lead = mongoose.model<ILead>('Lead', leadSchema);

export default Lead;
