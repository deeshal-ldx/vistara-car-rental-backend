import express from 'express';
import {
    createLead,
    getLeads,
    updateLeadStatus,
    deleteLead,
} from '../controllers/leadController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();


router.post('/', createLead);

// Admin routes for managing leads
router.get('/', protect, admin, getLeads);
router
    .route('/:id')
    .patch(protect, admin, updateLeadStatus)
    .delete(protect, admin, deleteLead);

export default router;
