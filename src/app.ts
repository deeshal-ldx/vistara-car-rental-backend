import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes';
import carRoutes from './routes/carRoutes';
import bookingRoutes from './routes/bookingRoutes';
import promoCodeRoutes from './routes/promoCodeRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';
import extraServiceRoutes from './routes/extraServiceRoutes';
import protectionPlanRoutes from './routes/protectionPlanRoutes';
import leadRoutes from './routes/leadRoutes';
import locationRoutes from './routes/locationRoutes';

const app: Application = express();

// Middleware
app.use(express.json());
const defaultAllowedOrigins = [
    'https://api.vistaracarrentalmauritius.com',
    'https://vistaracarrentalmauritius.com',
    'https://www.vistaracarrentalmauritius.com',
    'http://localhost:3000',
    'http://localhost:5173',
];

const envAllowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowedOrigins]));

app.use(
    cors({
        origin(origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
    })
);
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cars', carRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/promos', promoCodeRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/extras', extraServiceRoutes);
app.use('/api/v1/protection-plans', protectionPlanRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/locations', locationRoutes);

// Health Check
app.get('/api/v1/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('API is running....');
});

export default app;
