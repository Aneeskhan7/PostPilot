// backend/src/routes/ai.ts
import { Router, Request, Response, NextFunction } from 'express';
import Groq from 'groq-sdk';
import { z, ZodError } from 'zod';
import { requireAuth } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

const GenerateSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500),
  platform: z.enum(['instagram', 'facebook', 'linkedin']),
  tone: z.enum(['professional', 'casual', 'funny', 'inspirational']).default('casual'),
  includeHashtags: z.boolean().default(true),
});

const PLATFORM_RULES: Record<string, string> = {
  instagram: `Instagram caption structured as:
Line 1: Hook sentence with an emoji
(blank line)
Lines 2-4: 2-3 short punchy sentences, each on its own line
(blank line)
Line 5: Call-to-action sentence
(blank line)
Hashtags: 5-10 hashtags each on the same line separated by spaces
Max 2200 chars. Use emojis naturally.`,
  facebook: `Facebook post structured as:
Line 1: Opening hook
(blank line)
Lines 2-4: 2-3 body sentences, each on its own line
(blank line)
Line 5: Question or call-to-action to drive engagement
Max 500 words. No hashtags needed.`,
  linkedin: `LinkedIn post structured as:
Line 1: Bold hook statement (no emoji)
(blank line)
Lines 2-5: 3-4 insight sentences, each on its own line
(blank line)
Line 6: Key takeaway or call-to-action
(blank line)
Hashtags: 3-5 hashtags on one line
Max 3000 chars. Professional tone.`,
};

const TONE_DESC: Record<string, string> = {
  professional:  'professional and authoritative',
  casual:        'casual and friendly',
  funny:         'witty and humorous',
  inspirational: 'motivational and inspiring',
};

// POST /api/ai/generate — generate a caption using Groq
router.post('/generate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = GenerateSchema.parse(req.body);

    if (!process.env.GROQ_API_KEY) {
      throw new AppError('AI features not configured', 503, 'AI_NOT_CONFIGURED');
    }

    const prompt = `Write a social media post about: "${body.topic}".
Tone: ${TONE_DESC[body.tone]}.
${body.includeHashtags ? 'Include relevant hashtags.' : 'Do not include hashtags.'}

Follow this exact format for ${body.platform}:
${PLATFORM_RULES[body.platform]}

IMPORTANT: Use real blank lines between sections. Return only the post text — no explanations, no quotes, no preamble.`;

    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const caption = completion.choices[0]?.message?.content?.trim() ?? '';

    if (!caption) {
      throw new AppError('AI returned an empty response', 502, 'AI_EMPTY_RESPONSE');
    }

    res.json({ data: { caption } });
  } catch (err) {
    if (err instanceof AppError || err instanceof ZodError) { next(err); return; }
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

    if (!process.env.GROQ_API_KEY) {
      throw new AppError('AI features not configured', 503, 'AI_NOT_CONFIGURED');
    }

    const prompt = `Improve this ${body.platform} caption.
Instruction: ${body.instruction}
Original caption:
${body.caption}

Return only the improved caption — no explanations, no quotes, no preamble.`;

    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const caption = completion.choices[0]?.message?.content?.trim() ?? '';

    if (!caption) {
      throw new AppError('AI returned an empty response', 502, 'AI_EMPTY_RESPONSE');
    }

    res.json({ data: { caption } });
  } catch (err) {
    if (err instanceof AppError || err instanceof ZodError) { next(err); return; }
    const msg = err instanceof Error ? err.message : 'AI generation failed';
    next(new AppError(msg, 502, 'AI_ERROR'));
  }
});

export default router;
