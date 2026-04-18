// backend/src/routes/ai.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

// Mock Google Generative AI - needs to be done before importing
let mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

// Mock middleware
vi.mock('../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' };
    next();
  },
}));

describe('AI Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateContent.mockReset();
  });

  describe('POST /api/ai/generate', () => {
    it('generates a caption successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Generated caption for your topic! #hashtag #social',
        },
      });

      const requestBody = {
        topic: 'coffee in the morning',
        platform: 'instagram',
        tone: 'casual',
        includeHashtags: true,
      };

      const res = await request(app)
        .post('/api/ai/generate')
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('caption');
      expect(res.body.data.caption).toBe('Generated caption for your topic! #hashtag #social');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('returns 400 with invalid platform', async () => {
      const requestBody = {
        topic: 'test topic',
        platform: 'invalid_platform',
        tone: 'casual',
      };

      const res = await request(app)
        .post('/api/ai/generate')
        .send(requestBody);

      expect(res.status).toBe(400);
    });

    it('returns 400 with empty topic', async () => {
      const requestBody = {
        topic: '',
        platform: 'instagram',
        tone: 'casual',
      };

      const res = await request(app)
        .post('/api/ai/generate')
        .send(requestBody);

      expect(res.status).toBe(400);
    });

    it('returns 400 with topic too long', async () => {
      const requestBody = {
        topic: 'x'.repeat(501), // Exceeds 500 char limit
        platform: 'instagram',
        tone: 'casual',
      };

      const res = await request(app)
        .post('/api/ai/generate')
        .send(requestBody);

      expect(res.status).toBe(400);
    });

    it('handles AI service error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('AI service down'));

      const requestBody = {
        topic: 'test topic',
        platform: 'instagram',
        tone: 'casual',
      };

      const res = await request(app)
        .post('/api/ai/generate')
        .send(requestBody);

      expect(res.status).toBe(502);
    });

    it('handles empty AI response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '',
        },
      });

      const requestBody = {
        topic: 'test topic',
        platform: 'instagram',
        tone: 'casual',
      };

      const res = await request(app)
        .post('/api/ai/generate')
        .send(requestBody);

      expect(res.status).toBe(502);
    });

    it('generates different platform-specific content', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Professional LinkedIn content about topic',
        },
      });

      const requestBody = {
        topic: 'business growth',
        platform: 'linkedin',
        tone: 'professional',
        includeHashtags: true,
      };

      const res = await request(app)
        .post('/api/ai/generate')
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('LinkedIn')
      );
    });
  });

  describe('POST /api/ai/improve', () => {
    it('improves a caption successfully', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Improved version of the caption with more engagement!',
        },
      });

      const requestBody = {
        caption: 'Original caption here',
        platform: 'instagram',
        instruction: 'Make it more engaging',
      };

      const res = await request(app)
        .post('/api/ai/improve')
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('caption');
      expect(res.body.data.caption).toBe('Improved version of the caption with more engagement!');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('returns 400 with empty caption', async () => {
      const requestBody = {
        caption: '',
        platform: 'instagram',
        instruction: 'Make it better',
      };

      const res = await request(app)
        .post('/api/ai/improve')
        .send(requestBody);

      expect(res.status).toBe(400);
    });

    it('returns 400 with caption too long', async () => {
      const requestBody = {
        caption: 'x'.repeat(2201), // Exceeds 2200 char limit
        platform: 'instagram',
        instruction: 'Make it better',
      };

      const res = await request(app)
        .post('/api/ai/improve')
        .send(requestBody);

      expect(res.status).toBe(400);
    });

    it('uses default instruction when not provided', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Improved caption',
        },
      });

      const requestBody = {
        caption: 'Original caption',
        platform: 'instagram',
      };

      const res = await request(app)
        .post('/api/ai/improve')
        .send(requestBody);

      expect(res.status).toBe(200);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.stringContaining('Make it more engaging')
      );
    });

    it('handles AI service error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('AI service error'));

      const requestBody = {
        caption: 'Test caption',
        platform: 'instagram',
        instruction: 'Make it better',
      };

      const res = await request(app)
        .post('/api/ai/improve')
        .send(requestBody);

      expect(res.status).toBe(502);
    });
  });

  describe('AI not configured', () => {
    it('returns 503 when GEMINI_API_KEY is not set', async () => {
      delete process.env.GEMINI_API_KEY;

      const requestBody = {
        topic: 'test topic',
        platform: 'instagram',
        tone: 'casual',
      };

      const res = await request(app)
        .post('/api/ai/generate')
        .send(requestBody);

      expect(res.status).toBe(503);

      // Restore for other tests
      process.env.GEMINI_API_KEY = 'test-gemini-key';
    });
  });
});