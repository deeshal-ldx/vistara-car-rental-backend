import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { protect, admin } from '../middlewares/authMiddleware';
import { uploadMultipleImages, uploadSingleImage } from '../controllers/uploadController';

const router = express.Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadsDir);
    },
    filename(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = ext && ext.length <= 10 ? ext : '';
        const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;
        cb(null, name);
    },
});

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        cb(null, true);
        return;
    }
    cb(new Error('Only image files are allowed'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/image', protect, admin, upload.single('image'), uploadSingleImage);
router.post('/images', protect, admin, upload.array('images', 10), uploadMultipleImages);

export default router;

