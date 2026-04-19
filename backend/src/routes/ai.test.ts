// backend/src/routes/ai.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('groq-sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}));

vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  },
}));

import app from '../app';

const mockCaption = (text: string) =>
  mockCreate.mockResolvedValue({
    choices: [{ message: { content: text } }],
  });

describe('AI Routes', () => {
  const savedKey = process.env.GROQ_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = 'test-groq-key';
  });

  afterEach(() => {
    process.env.GROQ_API_KEY = savedKey;
  });

  describe('POST /api/ai/generate', () => {
    it('generates a caption successfully', async () => {
      mockCaption('Great caption! #hashtag #social');

      const res = await request(app)
        .post('/api/ai/generate')
        .send({ topic: 'coffee', platform: 'instagram', tone: 'casual', includeHashtags: true });

      expect(res.status).toBe(200);
      expect(res.body.data.caption).toBe('Great caption! #hashtag #social');
      expect(mockCreate).toHaveBeenCalledOnce();
    });

    it('returns 400 with invalid platform', async () => {
      const res = await request(app)
        .post('/api/ai/generate')
        .send({ topic: 'test', platform: 'invalid_platform', tone: 'casual' });

      expect(res.status).toBe(400);
    });

    it('returns 400 with empty topic', async () => {
      const res = await request(app)
        .post('/api/ai/generate')
        .send({ topic: '', platform: 'instagram', tone: 'casual' });

      expect(res.status).toBe(400);
    });

    it('returns 400 with topic too long', async () => {
      const res = await request(app)
        .post('/api/ai/generate')
        .send({ topic: 'x'.repeat(501), platform: 'instagram', tone: 'casual' });

      expect(res.status).toBe(400);
    });

    it('handles AI service error', async () => {
      mockCreate.mockRejectedValue(new Error('Groq service down'));

      const res = await request(app)
        .post('/api/ai/generate')
        .send({ topic: 'test', platform: 'instagram', tone: 'casual' });

      expect(res.status).toBe(502);
    });

    it('handles empty AI response', async () => {
      mockCreate.mockResolvedValue({ choices: [{ message: { content: '   ' } }] });

      const res = await request(app)
        .post('/api/ai/generate')
        .send({ topic: 'test', platform: 'instagram', tone: 'casual' });

      expect(res.status).toBe(502);
    });

    it('generates platform-specific content for linkedin', async () => {
      mockCaption('Professional LinkedIn post about business growth');

      const res = await request(app)
        .post('/api/ai/generate')
        .send({ topic: 'business growth', platform: 'linkedin', tone: 'professional', includeHashtags: true });

      expect(res.status).toBe(200);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('linkedin'),
            }),
          ]),
        })
      );
    });

    it('returns 503 when GROQ_API_KEY is not set', async () => {
      delete process.env.GROQ_API_KEY;

      const res = await request(app)
        .post('/api/ai/generate')
        .send({ topic: 'test', platform: 'instagram', tone: 'casual' });

      expect(res.status).toBe(503);
    });
  });

  describe('POST /api/ai/improve', () => {
    it('improves a caption successfully', async () => {
      mockCaption('Improved version with more engagement!');

      const res = await request(app)
        .post('/api/ai/improve')
        .send({ caption: 'Original caption', platform: 'instagram', instruction: 'Make it more engaging' });

      expect(res.status).toBe(200);
      expect(res.body.data.caption).toBe('Improved version with more engagement!');
      expect(mockCreate).toHaveBeenCalledOnce();
    });

    it('returns 400 with empty caption', async () => {
      const res = await request(app)
        .post('/api/ai/improve')
        .send({ caption: '', platform: 'instagram' });

      expect(res.status).toBe(400);
    });

    it('returns 400 with caption too long', async () => {
      const res = await request(app)
        .post('/api/ai/improve')
        .send({ caption: 'x'.repeat(2201), platform: 'instagram' });

      expect(res.status).toBe(400);
    });

    it('uses default instruction when not provided', async () => {
      mockCaption('Improved caption');

      const res = await request(app)
        .post('/api/ai/improve')
        .send({ caption: 'Original caption', platform: 'instagram' });

      expect(res.status).toBe(200);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Make it more engaging'),
            }),
          ]),
        })
      );
    });

    it('handles AI service error', async () => {
      mockCreate.mockRejectedValue(new Error('Groq service error'));

      const res = await request(app)
        .post('/api/ai/improve')
        .send({ caption: 'Test caption', platform: 'instagram', instruction: 'Make it better' });

      expect(res.status).toBe(502);
    });
  });
});
