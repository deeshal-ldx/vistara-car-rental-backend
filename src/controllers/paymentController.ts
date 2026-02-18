import { Request, Response } from 'express';
import Stripe from 'stripe';
import Transaction from '../models/Transaction';
import Booking from '../models/Booking';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    console.warn('STRIPE_SECRET_KEY is not set. Stripe payments are disabled.');
}

const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, {
          // @ts-ignore
          apiVersion: '2025-01-27.acacia',
      })
    : null;

// @desc    Create Stripe Payment Intent
// @route   POST /api/v1/payments/create-intent
// @access  Private
export const createPaymentIntent = async (req: Request, res: Response) => {
    const { bookingId } = req.body;

    if (!stripe) {
        res.status(500).json({ message: 'Stripe is not configured on the server' });
        return;
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        res.status(404).json({ message: 'Booking not found' });
        return;
    }

    // Ensure amount is correct (Stripe uses cents) and based on booking totalPrice
    const paymentAmount = Math.round(booking.totalPrice * 100);

    const paymentIntent = await stripe.paymentIntents.create({
        amount: paymentAmount,
        currency: 'mur',
        automatic_payment_methods: {
            enabled: true,
        },
        metadata: { bookingId, userId: (req.user as any)._id.toString() },
    });

    res.json({
        clientSecret: paymentIntent.client_secret,
        transactionId: paymentIntent.id,
    });
};

// @desc    Confirm Stripe payment and mark booking as paid
// @route   POST /api/v1/payments/confirm
// @access  Private
export const confirmStripePayment = async (req: Request, res: Response) => {
    const { bookingId, paymentIntentId } = req.body;

    if (!stripe) {
        res.status(500).json({ message: 'Stripe is not configured on the server' });
        return;
    }

    if (!bookingId || !paymentIntentId) {
        res.status(400).json({ message: 'bookingId and paymentIntentId are required' });
        return;
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
        res.status(404).json({ message: 'Booking not found' });
        return;
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
        res.status(400).json({ message: 'Payment not completed' });
        return;
    }

    if (
        paymentIntent.metadata?.bookingId &&
        paymentIntent.metadata.bookingId.toString() !== bookingId.toString()
    ) {
        res.status(400).json({ message: 'Payment does not belong to this booking' });
        return;
    }

    const expectedAmount = Math.round(booking.totalPrice * 100);
    if (paymentIntent.amount !== expectedAmount) {
        res.status(400).json({ message: 'Payment amount mismatch' });
        return;
    }

    let transaction = await Transaction.findOne({ transactionId: paymentIntent.id });

    const paidAmountRs = booking.totalPrice;

    if (transaction) {
        transaction.status = 'success';
        transaction.amount = paidAmountRs;
        await transaction.save();
    } else {
        transaction = await Transaction.create({
            user: req.user?._id as any,
            booking: bookingId,
            amount: paidAmountRs,
            paymentMethod: 'stripe',
            transactionId: paymentIntent.id,
            status: 'success',
        });
    }

    booking.paymentStatus = 'paid';
    await booking.save();

    res.json({ booking, transaction });
};

export const refundStripePaymentForBooking = async (req: Request, res: Response) => {
    const { bookingId } = req.body;

    if (!stripe) {
        res.status(500).json({ message: 'Stripe is not configured on the server' });
        return;
    }

    if (!bookingId) {
        res.status(400).json({ message: 'bookingId is required' });
        return;
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
        res.status(404).json({ message: 'Booking not found' });
        return;
    }

    if (booking.paymentStatus !== 'paid') {
        res.status(400).json({ message: 'Booking is not paid' });
        return;
    }

    const transaction = await Transaction.findOne({
        booking: bookingId,
        paymentMethod: 'stripe',
        status: 'success',
    }).sort({ createdAt: -1 });

    if (!transaction || !transaction.transactionId) {
        res.status(404).json({ message: 'No successful Stripe transaction found for this booking' });
        return;
    }

    if (transaction.refundId) {
        res.status(400).json({ message: 'Transaction already refunded' });
        return;
    }

    const refundAmountCents = Math.round(transaction.amount * 100);

    const refund = await stripe.refunds.create({
        payment_intent: transaction.transactionId,
        amount: refundAmountCents,
    });

    transaction.refundId = refund.id;
    transaction.refundAmount = transaction.amount;
    transaction.refundStatus = refund.status as 'pending' | 'succeeded' | 'failed';
    await transaction.save();

    booking.paymentStatus = 'refunded';
    booking.status = 'cancelled';
    await booking.save();

    res.json({ booking, transaction, refund });
};

// @desc    Record manual payment (Bank transfer) or verify Stripe payment
// @route   POST /api/v1/payments/record
// @access  Private
export const recordPayment = async (req: Request, res: Response) => {
    const { bookingId, amount, paymentMethod, transactionId, proofImage } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        res.status(404).json({ message: 'Booking not found' });
        return;
    }

    const recordAmount = booking.totalPrice;

    const transaction = await Transaction.create({
        user: req.user?._id as any,
        booking: bookingId,
        amount: recordAmount,
        paymentMethod,
        transactionId,
        proofImage,
        status: paymentMethod === 'stripe' ? 'success' : 'pending',
    });

    if (paymentMethod === 'stripe') {
        booking.paymentStatus = 'paid';
        await booking.save();
    }

    res.status(201).json(transaction);
};

// @desc    Get all transactions
// @route   GET /api/v1/payments
// @access  Private/Admin
export const getTransactions = async (req: Request, res: Response) => {
    const transactions = await Transaction.find({}).populate('user', 'name email').populate('booking');
    res.json(transactions);
};

// @desc    Update transaction status (for manual/bank transfer)
// @route   PUT /api/v1/payments/:id/status
// @access  Private/Admin
export const updateTransactionStatus = async (req: Request, res: Response) => {
    const { status } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        res.status(404).json({ message: 'Transaction not found' });
        return;
    }

    transaction.status = status;
    await transaction.save();

    if (status === 'success') {
        const booking = await Booking.findById(transaction.booking);
        if (booking) {
            booking.paymentStatus = 'paid';
            await booking.save();
        }
    }

    res.json(transaction);
};
