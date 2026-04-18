// backend/src/routes/media.ts
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { uploadFile, deleteFile, validateFile } from '../services/storage';
import { z } from 'zod';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type not allowed: ${file.mimetype}`, 400, 'INVALID_FILE_TYPE'));
    }
  },
});

const DeleteSchema = z.object({
  url: z.string().url(),
});

// POST /api/media/upload — upload a single file to Supabase Storage
router.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('No file provided', 400, 'MISSING_FILE');
      }

      // Double-check MIME matches extension (defence in depth)
      validateFile(req.file.mimetype, req.file.size);

      const publicUrl = await uploadFile(
        req.user.id,
        req.file.buffer,
        req.file.mimetype,
        req.file.size
      );

      res.status(201).json({ data: { url: publicUrl } });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/media — delete a file from Supabase Storage
router.delete('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = DeleteSchema.parse(req.body);

    // Ensure the URL belongs to our storage bucket
    if (!url.includes('/storage/v1/object/public/post-media/')) {
      throw new AppError('Invalid storage URL', 400, 'INVALID_URL');
    }

    // Ensure the path contains the user's ID (ownership check)
    if (!url.includes(`/${req.user.id}/`)) {
      throw new AppError('You do not own this file', 403, 'FORBIDDEN');
    }

    await deleteFile(url);

    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
