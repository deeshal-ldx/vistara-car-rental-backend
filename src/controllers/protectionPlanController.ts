import { Request, Response } from 'express';
import ProtectionPlan from '../models/ProtectionPlan';

export const getProtectionPlans = async (req: Request, res: Response) => {
    const plans = await ProtectionPlan.find({ isActive: true });
    res.json(plans);
};

export const createProtectionPlan = async (req: Request, res: Response) => {
    const { name, subtitle, features, price, type, isActive } = req.body;

    const protectionPlan = await ProtectionPlan.create({
        name,
        subtitle,
        features,
        price,
        type,
        isActive,
    });

    res.status(201).json(protectionPlan);
};

export const updateProtectionPlan = async (req: Request, res: Response) => {
    const { name, subtitle, features, price, type, isActive } = req.body;

    const protectionPlan = await ProtectionPlan.findById(req.params.id);

    if (protectionPlan) {
        protectionPlan.name = name || protectionPlan.name;
        protectionPlan.subtitle = subtitle || protectionPlan.subtitle;
        if (features !== undefined) {
            protectionPlan.features = features;
        }
        protectionPlan.price = price !== undefined ? price : protectionPlan.price;
        protectionPlan.type = type || protectionPlan.type;
        protectionPlan.isActive = isActive !== undefined ? isActive : protectionPlan.isActive;

        const updatedProtectionPlan = await protectionPlan.save();
        res.json(updatedProtectionPlan);
    } else {
        res.status(404).json({ message: 'Protection plan not found' });
    }
};

export const deleteProtectionPlan = async (req: Request, res: Response) => {
    const protectionPlan = await ProtectionPlan.findById(req.params.id);

    if (protectionPlan) {
        await protectionPlan.deleteOne();
        res.json({ message: 'Protection plan removed' });
    } else {
        res.status(404).json({ message: 'Protection plan not found' });
    }
};

