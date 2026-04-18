// backend/src/routes/media.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

// Mock dependencies
vi.mock('../services/storage');

// Mock middleware
vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  },
}));

import * as storage from '../services/storage';

const mockStorage = storage as any;

describe('Media Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/media/upload', () => {
    it('uploads a file successfully', async () => {
      mockStorage.validateFile = vi.fn();
      mockStorage.uploadFile = vi.fn().mockResolvedValue('https://example.com/image.jpg');

      // Create a mock file buffer
      const fileBuffer = Buffer.from('fake image data');

      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', fileBuffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('url');
      expect(mockStorage.uploadFile).toHaveBeenCalledWith(
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
      const fileBuffer = Buffer.from('fake file data');

      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', fileBuffer, {
          filename: 'test.txt',
          contentType: 'text/plain',
        });

      expect(res.status).toBe(400);
    });

    it('returns 400 for file too large', async () => {
      // Create a file larger than 50MB
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024);

      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', largeBuffer, {
          filename: 'large.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(413); // Payload too large
    });

    it('handles upload service error', async () => {
      mockStorage.validateFile = vi.fn();
      mockStorage.uploadFile = vi.fn().mockRejectedValue(new Error('Upload failed'));

      const fileBuffer = Buffer.from('fake image data');

      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', fileBuffer, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /api/media', () => {
    it('deletes a file successfully', async () => {
      mockStorage.deleteFile = vi.fn().mockResolvedValue(undefined);

      const validUrl = 'https://example.supabase.co/storage/v1/object/public/post-media/test-user-id/image.jpg';

      const res = await request(app)
        .delete('/api/media')
        .send({ url: validUrl });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(mockStorage.deleteFile).toHaveBeenCalledWith(validUrl);
    });

    it('returns 400 for invalid URL format', async () => {
      const invalidUrl = 'https://other-service.com/image.jpg';

      const res = await request(app)
        .delete('/api/media')
        .send({ url: invalidUrl });

      expect(res.status).toBe(400);
    });

    it('returns 403 for file not owned by user', async () => {
      const otherUserUrl = 'https://example.supabase.co/storage/v1/object/public/post-media/other-user-id/image.jpg';

      const res = await request(app)
        .delete('/api/media')
        .send({ url: otherUserUrl });

      expect(res.status).toBe(403);
    });

    it('returns 400 for missing URL', async () => {
      const res = await request(app)
        .delete('/api/media')
        .send({});

      expect(res.status).toBe(400);
    });

    it('handles delete service error', async () => {
      mockStorage.deleteFile = vi.fn().mockRejectedValue(new Error('Delete failed'));

      const validUrl = 'https://example.supabase.co/storage/v1/object/public/post-media/test-user-id/image.jpg';

      const res = await request(app)
        .delete('/api/media')
        .send({ url: validUrl });

      expect(res.status).toBe(500);
    });
  });
});