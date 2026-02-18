import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
    user: mongoose.Schema.Types.ObjectId;
    booking: mongoose.Schema.Types.ObjectId;
    amount: number;
    paymentMethod: 'stripe' | 'manual' | 'cash';
    status: 'pending' | 'success' | 'failed';
    transactionId?: string; // Stripe PaymentIntent ID
    proofImage?: string; // For manual bank transfer
    refundId?: string;
    refundAmount?: number;
    refundStatus?: 'pending' | 'succeeded' | 'failed';
}

const transactionSchema = new Schema<ITransaction>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ['stripe', 'manual', 'cash'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'success', 'failed'],
            default: 'pending',
        },
        transactionId: {
            type: String,
        },
        proofImage: {
            type: String,
        },
        refundId: {
            type: String,
        },
        refundAmount: {
            type: Number,
        },
        refundStatus: {
            type: String,
            enum: ['pending', 'succeeded', 'failed'],
        },
    },
    {
        timestamps: true,
    }
);

const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);

export default Transaction;
