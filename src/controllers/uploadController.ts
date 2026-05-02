import { Request, Response } from 'express';

export const uploadSingleImage = async (req: Request, res: Response) => {
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }

    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || '';
    const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol;
    const host = req.get('host');
    const url = host ? `${protocol}://${host}/uploads/${file.filename}` : `/uploads/${file.filename}`;

    res.status(201).json({
        success: true,
        fileName: file.filename,
        url,
    });
};

export const uploadMultipleImages = async (req: Request, res: Response) => {
    const files = (req as any).files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
        res.status(400).json({ message: 'No files uploaded' });
        return;
    }

    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || '';
    const protocol = forwardedProto ? forwardedProto.split(',')[0].trim() : req.protocol;
    const host = req.get('host');

    const data = files.map((file) => {
        const url = host ? `${protocol}://${host}/uploads/${file.filename}` : `/uploads/${file.filename}`;
        return { fileName: file.filename, url };
    });

    res.status(201).json({
        success: true,
        data,
    });
};

