import { Request, Response } from 'express';
import User from '../models/User';
import generateToken from '../utils/generateToken';

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const user = await User.create({
        name,
        email,
        password,
        role: role || 'customer',
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken((user._id as unknown) as string, user.role),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/v1/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken((user._id as unknown) as string, user.role),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Login if user exists, otherwise register and return token
// @route   POST /api/v1/auth/upsert
// @access  Public
export const upsertUser = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        if (!(await existingUser.matchPassword(password))) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        res.json({
            _id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            token: generateToken((existingUser._id as unknown) as string, existingUser.role),
        });
        return;
    }

    const user = await User.create({
        name: name || email.split('@')[0],
        email,
        password,
        role: role || 'customer',
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken((user._id as unknown) as string, user.role),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};
