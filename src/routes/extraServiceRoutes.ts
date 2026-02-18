import express from 'express';
import {
    getExtraServices,
    createExtraService,
    updateExtraService,
    deleteExtraService,
} from '../controllers/extraServiceController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/').get(getExtraServices).post(protect, admin, createExtraService);
router
    .route('/:id')
    .put(protect, admin, updateExtraService)
    .delete(protect, admin, deleteExtraService);

export default router;
