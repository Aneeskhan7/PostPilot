// backend/src/routes/ai.ts
import { Router, Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const GenerateSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500),
  platform: z.enum(['instagram', 'facebook', 'linkedin']),
  tone: z.enum(['professional', 'casual', 'funny', 'inspirational']).default('casual'),
  includeHashtags: z.boolean().default(true),
});

const PLATFORM_RULES: Record<string, string> = {
  instagram: 'Instagram caption (max 2200 chars, include 5-10 relevant hashtags at the end if requested, use emojis naturally)',
  facebook:  'Facebook post (conversational, max 500 words, no need for hashtags)',
  linkedin:  'LinkedIn post (professional, max 3000 chars, 3-5 hashtags at end if requested, thought-leadership tone)',
};

const TONE_DESC: Record<string, string> = {
  professional:  'professional and authoritative',
  casual:        'casual and friendly',
  funny:         'witty and humorous',
  inspirational: 'motivational and inspiring',
};

// POST /api/ai/generate — generate a caption using Gemini
router.post('/generate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = GenerateSchema.parse(req.body);

    if (!process.env.GEMINI_API_KEY) {
      throw new AppError('AI features not configured', 503, 'AI_NOT_CONFIGURED');
    }

    const prompt = `Write a ${PLATFORM_RULES[body.platform]} about: "${body.topic}".
Tone: ${TONE_DESC[body.tone]}.
${body.includeHashtags ? 'Include relevant hashtags.' : 'Do not include hashtags.'}
Return only the caption text — no explanations, no quotes around it, no preamble.`;

    const result = await model.generateContent(prompt);
    const caption = result.response.text().trim();

    if (!caption) {
      throw new AppError('Gemini returned an empty response', 502, 'AI_EMPTY_RESPONSE');
    }

    res.json({ data: { caption } });
  } catch (err) {
    if (err instanceof AppError) { next(err); return; }
    const msg = err instanceof Error ? err.message : 'AI generation failed';
    next(new AppError(msg, 502, 'AI_ERROR'));
  }
});

// POST /api/ai/improve — improve existing caption
router.post('/improve', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      caption: z.string().min(1).max(2200),
      platform: z.enum(['instagram', 'facebook', 'linkedin']),
      instruction: z.string().max(200).default('Make it more engaging'),
    }).parse(req.body);

    if (!process.env.GEMINI_API_KEY) {
      throw new AppError('AI features not configured', 503, 'AI_NOT_CONFIGURED');
    }

    const prompt = `Improve this ${body.platform} caption.
Instruction: ${body.instruction}
Original caption:
${body.caption}

Return only the improved caption — no explanations, no quotes, no preamble.`;

    const result = await model.generateContent(prompt);
    const caption = result.response.text().trim();

    if (!caption) {
      throw new AppError('Gemini returned an empty response', 502, 'AI_EMPTY_RESPONSE');
    }

    res.json({ data: { caption } });
  } catch (err) {
    if (err instanceof AppError) { next(err); return; }
    const msg = err instanceof Error ? err.message : 'AI generation failed';
    next(new AppError(msg, 502, 'AI_ERROR'));
  }
});

export default router;
