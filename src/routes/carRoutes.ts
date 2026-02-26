import express from 'express';
import {
    getCars,
    getCarById,
    getAdminCars,
    createCar,
    updateCar,
    deleteCar,
} from '../controllers/carController';
import { protect, admin } from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/').get(getCars).post(protect, admin, createCar);
router.get('/admin', protect, admin, getAdminCars);
router
    .route('/:id')
    .get(getCarById)
    .put(protect, admin, updateCar)
    .delete(protect, admin, deleteCar);

export default router;
