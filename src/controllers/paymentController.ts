import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction';
import Booking from '../models/Booking';

const mobiPaidApiKey = process.env.MOBI_PAID_API_KEY;
const mobiPaidMode = process.env.MOBI_PAID_MODE || 'test';
const mobiPaidBaseUrl = mobiPaidMode === 'live' ? 'https://live.mobipaid.io' : 'https://test.mobipaid.io';

if (!mobiPaidApiKey) {
    console.warn('MOBI_PAID_API_KEY is not set. MobiPaid payments are disabled.');
}

// @desc    Create MobiPaid Payment Request
// @route   POST /api/v1/payments/create-intent
// @access  Private
export const createMobiPaidPaymentRequest = async (req: Request, res: Response) => {
    const { bookingId } = req.body;

    if (!mobiPaidApiKey) {
        res.status(500).json({ message: 'MobiPaid is not configured on the server' });
        return;
    }

    console.log("api key", mobiPaidApiKey);
    console.log("mode", mobiPaidMode);

    const booking = await Booking.findById(bookingId);

    console.log('Booking:', booking);
    if (!booking) {
        res.status(404).json({ message: 'Booking not found' });
        return;
    }

    const user = req.user as any;

    const customerIp = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || req.socket.remoteAddress || '';

    const payload = {
        request_methods: ['WEB'],
        reference_number: booking._id.toString(),
        email: user.email,
        customer_first_name: user.name?.split(' ')[0] || 'Customer',
        customer_last_name: user.name?.split(' ').slice(1).join(' ') || '',
        customer_ip: customerIp,
        redirect_url: `${process.env.FRONTEND_URL}/bookings/${booking._id}?payment=processing`,
        response_url: `${process.env.BACKEND_URL}/api/v1/payments/mobipaid-webhook`,
        cancel_url: `${process.env.FRONTEND_URL}/bookings/${booking._id}?payment=cancelled`,
        fixed_amount: true,
        currency: 'MUR',
        amount: booking.totalPrice,
        payment_type: 'DB',
        payment_methods: [],
    };

    console.log('Payload:', payload);

    try {
        const response = await fetch(`${mobiPaidBaseUrl}/v2/payment-requests/`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mobiPaidApiKey}`, // ✅ NOT Bearer
    },
    body: JSON.stringify({
        access_key: mobiPaidApiKey, // ✅ ALSO REQUIRED
        request_methods: ['WEB'],
        reference_number: booking._id.toString(),
        email: user.email,
        customer_first_name: user.name?.split(' ')[0] || 'Customer',
        customer_last_name: user.name?.split(' ').slice(1).join(' ') || '',
        customer_ip: customerIp,
        redirect_url: `${process.env.FRONTEND_URL}/bookings/${booking._id}?payment=processing`,
        response_url: `${process.env.BACKEND_URL}/api/v1/payments/mobipaid-webhook`,
        cancel_url: `${process.env.FRONTEND_URL}/bookings/${booking._id}?payment=cancelled`,
        fixed_amount: true,
        currency: 'MUR',
        amount: booking.totalPrice,
        payment_type: 'DB',
        payment_methods: [],
    }),
});

        const data = await response.json();
        console.log('MobiPaid response:', data);

        if (!response.ok || data.result === 'failed') {
            console.error('MobiPaid error:', data);
            res.status(400).json({ message: data.error_message || 'Failed to create payment request' });
            return;
        }

        res.json({
            paymentUrl: data.short_url || data.long_url,
            qrCodeLink: data.qrcode_link,
            transactionId: data.transaction_id,
        });
    } catch (error: any) {
        console.error('MobiPaid request failed:', error);
        res.status(500).json({ message: 'Failed to connect to MobiPaid' });
    }
};

// @desc    Handle MobiPaid Payment Webhook
// @route   POST /api/v1/payments/mobipaid-webhook
// @access  Public (MobiPaid callback)
export const handleMobiPaidWebhook = async (req: Request, res: Response) => {
    const responseParam = req.body.response;
    if (!responseParam) {
        res.status(400).send('Missing response');
        return;
    }

    let paymentResponse;
    try {
        paymentResponse = JSON.parse(responseParam);
    } catch (e) {
        res.status(400).send('Invalid response JSON');
        return;
    }

    const { result, result_code, transaction_id, reference_number, amount } = paymentResponse;

    const isSuccess = result === 'ACK' && 
        (result_code === '000.000.000' || result_code === '000.100.110');

    if (!isSuccess) {
        res.status(200).send('OK');
        return;
    }

    const booking = await Booking.findById(reference_number);
    if (!booking) {
        res.status(200).send('OK');
        return;
    }

    if (parseFloat(amount) !== booking.totalPrice) {
        res.status(200).send('OK');
        return;
    }

    let transaction = await Transaction.findOne({ transactionId: transaction_id });

    if (transaction) {
        transaction.status = 'success';
        transaction.amount = parseFloat(amount);
        await transaction.save();
    } else {
        transaction = await Transaction.create({
            user: booking.user as any,
            booking: booking._id as any,
            amount: parseFloat(amount),
            paymentMethod: 'mobipaid',
            transactionId: transaction_id,
            status: 'success',
        });
    }

    booking.paymentStatus = 'paid';
    await booking.save();

    res.status(200).send('OK');
};

// @desc    Refund MobiPaid Payment
// @route   POST /api/v1/payments/refund
// @access  Private/Admin
export const refundMobiPaidPaymentForBooking = async (req: Request, res: Response) => {
    const { bookingId } = req.body;

    if (!mobiPaidApiKey) {
        res.status(500).json({ message: 'MobiPaid is not configured on the server' });
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
        paymentMethod: 'mobipaid',
        status: 'success',
    }).sort({ createdAt: -1 });

    if (!transaction || !transaction.transactionId) {
        res.status(404).json({ message: 'No successful MobiPaid transaction found' });
        return;
    }

    if (transaction.refundId) {
        res.status(400).json({ message: 'Already refunded' });
        return;
    }

    try {
        const refundResponse = await fetch(`${mobiPaidBaseUrl}/v2/payments/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mobiPaidApiKey}`,
            },
            body: JSON.stringify({
                transaction_id: transaction.transactionId,
                amount: transaction.amount,
            }),
        });

        const refundData = await refundResponse.json();

        if (!refundResponse.ok || refundData.result === 'failed') {
            // console.error('MobiPaid refund error:', refundData);
            res.status(400).json({ message: refundData.error_message || 'Refund failed' });
            return;
        }

        transaction.refundId = refundData.refund_id;
        transaction.refundAmount = transaction.amount;
        transaction.refundStatus = 'succeeded';
        await transaction.save();

        booking.paymentStatus = 'refunded';
        booking.status = 'cancelled';
        await booking.save();

        res.json({ booking, transaction, refund: refundData });
    } catch (error: any) {
        console.error('MobiPaid refund request failed:', error);
        res.status(500).json({ message: 'Failed to process refund' });
    }
};

// @desc    Record manual payment or MobiPaid payment
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
        status: paymentMethod === 'mobipaid' ? 'success' : 'pending',
    });

    if (paymentMethod === 'mobipaid') {
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

// @desc    Update transaction status
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
