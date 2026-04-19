// backend/src/routes/media.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../services/storage', () => ({
  uploadFile: vi.fn(),
  validateFile: vi.fn(),
  deleteFile: vi.fn(),
}));

vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  },
}));

import app from '../app';
import * as storage from '../services/storage';

const mockUpload   = vi.mocked(storage.uploadFile);
const mockValidate = vi.mocked(storage.validateFile);
const mockDelete   = vi.mocked(storage.deleteFile);

describe('Media Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/media/upload', () => {
    it('uploads a file successfully', async () => {
      mockValidate.mockReturnValue(undefined);
      mockUpload.mockResolvedValue('https://example.com/image.jpg');

      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', Buffer.from('fake image data'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('url');
      expect(mockUpload).toHaveBeenCalledWith(
        'test-user-id',
        expect.any(Buffer),
        'image/jpeg',
        expect.any(Number)
      );
    });

    it('returns 400 when no file provided', async () => {
      const res = await request(app).post('/api/media/upload');
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid file type', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', Buffer.from('data'), { filename: 'test.txt', contentType: 'text/plain' });

      expect(res.status).toBe(400);
    });

    it('returns 413 for file too large', async () => {
      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', Buffer.alloc(51 * 1024 * 1024), { filename: 'large.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(413);
    });

    it('handles upload service error', async () => {
      mockValidate.mockReturnValue(undefined);
      mockUpload.mockRejectedValue(new Error('Upload failed'));

      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', Buffer.from('fake image data'), { filename: 'test.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /api/media', () => {
    const validUrl = 'https://example.supabase.co/storage/v1/object/public/post-media/test-user-id/image.jpg';

    it('deletes a file successfully', async () => {
      mockDelete.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/media')
        .send({ url: validUrl });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith(validUrl);
    });

    it('returns 400 for invalid storage URL', async () => {
      const res = await request(app)
        .delete('/api/media')
        .send({ url: 'https://other-service.com/image.jpg' });

      expect(res.status).toBe(400);
    });

    it('returns 403 for file not owned by user', async () => {
      const res = await request(app)
        .delete('/api/media')
        .send({ url: 'https://example.supabase.co/storage/v1/object/public/post-media/other-user-id/image.jpg' });

      expect(res.status).toBe(403);
    });

    it('returns 400 for missing URL', async () => {
      const res = await request(app).delete('/api/media').send({});
      expect(res.status).toBe(400);
    });

    it('handles delete service error', async () => {
      mockDelete.mockRejectedValue(new Error('Delete failed'));

      const res = await request(app)
        .delete('/api/media')
        .send({ url: validUrl });

      expect(res.status).toBe(500);
    });
  });
});
