import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
    user: mongoose.Schema.Types.ObjectId;
    car: mongoose.Schema.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    bookingType: 'rental' | 'airport_transfer';
    airportTransferDetails?: {
        transferType: 'one_way' | 'two_way';
        numberOfTravelers: number;
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        flightNumber?: string;
        pickupTime?: string;
        returnDate?: Date;
        returnTime?: string;
        additionalInfo?: string;
    };
    paymentMethod: 'stripe' | 'manual' | 'cash';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    driverDetails: {
        name: string;
        licenseNumber: string;
        phone: string;
        age: number;
    };
    pickupLocation: string;
    dropoffLocation: string;
    extraServices: {
        service: mongoose.Schema.Types.ObjectId;
        quantity: number;
        priceAtBooking: number; 
        total: number;
    }[];
    protectionPlan?: {
        plan: mongoose.Schema.Types.ObjectId;
        priceAtBooking: number;
        type: 'flat' | 'per_day';
        total: number;
    };
    promo?: {
        code: string;
        discountType: 'percentage' | 'fixed';
        value: number;
        minOrderValue?: number;
        discountAmount: number;
    };
    pickupDropoffFees?: {
        pickupLocation: string;
        dropoffLocation: string;
        pickUpFee: number;
        dropOffFee: number;
        total: number;
    };
}

const bookingSchema = new Schema<IBooking>(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        car: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Car',
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        bookingType: {
            type: String,
            enum: ['rental', 'airport_transfer'],
            default: 'rental',
        },
        airportTransferDetails: {
            transferType: { type: String, enum: ['one_way', 'two_way'] },
            numberOfTravelers: { type: Number },
            customerName: { type: String },
            customerEmail: { type: String },
            customerPhone: { type: String },
            flightNumber: { type: String },
            pickupTime: { type: String },
            returnDate: { type: Date },
            returnTime: { type: String },
            additionalInfo: { type: String },
        },
        paymentMethod: {
            type: String,
            enum: ['stripe', 'manual', 'cash'],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            default: 'pending',
        },
        driverDetails: {
            name: { type: String, required: true },
            licenseNumber: { type: String, required: true },
            phone: { type: String, required: true },
            age: { type: Number, required: true },
        },
        pickupLocation: { type: String, required: true },
        dropoffLocation: { type: String, required: true },
        extraServices: [
            {
                service: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'ExtraService',
                },
                quantity: { type: Number, default: 1 },
                priceAtBooking: { type: Number, required: true },
                total: { type: Number, required: true },
            },
        ],
        protectionPlan: {
            plan: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ProtectionPlan',
            },
            priceAtBooking: { type: Number },
            type: { type: String, enum: ['flat', 'per_day'] },
            total: { type: Number },
        },
        promo: {
            code: { type: String },
            discountType: { type: String, enum: ['percentage', 'fixed'] },
            value: { type: Number },
            minOrderValue: { type: Number },
            discountAmount: { type: Number },
        },
        pickupDropoffFees: {
            pickupLocation: { type: String },
            dropoffLocation: { type: String },
            pickUpFee: { type: Number },
            dropOffFee: { type: Number },
            total: { type: Number },
        },
    },
    {
        timestamps: true,
    }
);

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
