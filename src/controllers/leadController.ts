import { Request, Response } from 'express';
import Lead from '../models/Lead';

// @desc    Create a new lead/contact us entry
// @route   POST /api/v1/leads
// @access  Public
export const createLead = async (req: Request, res: Response) => {
    const { fullName, email, message, isAgreed, source } = req.body;

    if (!fullName || !email || !message || isAgreed === undefined) {
        res.status(400).json({ message: 'Please provide all required fields' });
        return;
    }

    if (!isAgreed) {
        res.status(400).json({ message: 'You must agree to the terms' });
        return;
    }

    const lead = await Lead.create({
        fullName,
        email,
        message,
        isAgreed,
        source,
    });

    res.status(201).json({
        success: true,
        data: lead,
    });
};

// @desc    Get all leads with filters and stats
// @route   GET /api/v1/leads
// @access  Private/Admin
export const getLeads = async (req: Request, res: Response) => {
    const {
        status,
        search,
        page = '1',
        limit = '10',
    } = req.query as {
        status?: string;
        search?: string;
        page?: string;
        limit?: string;
    };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};

    if (status) {
        query.status = status;
    }

    if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [{ fullName: regex }, { email: regex }, { message: regex }];
    }

    try {
        const total = await Lead.countDocuments(query);

        // Calculate stats
        const stats = await Lead.aggregate([
            {
                $group: {
                    _id: null,
                    totalLeads: { $sum: 1 },
                    newLeads: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
                    contactedLeads: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
                    resolvedLeads: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
                },
            },
        ]);

        const leads = await Lead.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.json({
            success: true,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            limit: limitNum,
            stats: stats[0] || { totalLeads: 0, newLeads: 0, contactedLeads: 0, resolvedLeads: 0 },
            data: leads,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update lead status
// @route   PATCH /api/v1/leads/:id
// @access  Private/Admin
export const updateLeadStatus = async (req: Request, res: Response) => {
    const { status } = req.body;

    const lead = await Lead.findById(req.params.id);

    if (lead) {
        lead.status = status || lead.status;
        const updatedLead = await lead.save();
        res.json({ success: true, data: updatedLead });
    } else {
        res.status(404).json({ message: 'Lead not found' });
    }
};

// @desc    Delete a lead
// @route   DELETE /api/v1/leads/:id
// @access  Private/Admin
export const deleteLead = async (req: Request, res: Response) => {
    const lead = await Lead.findById(req.params.id);

    if (lead) {
        await lead.deleteOne();
        res.json({ success: true, message: 'Lead removed' });
    } else {
        res.status(404).json({ message: 'Lead not found' });
    }
};
