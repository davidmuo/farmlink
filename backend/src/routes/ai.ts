import { Router, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are FarmLink's agricultural assistant for smallholder farmers in Nigeria.
You help farmers with:
- Plant disease diagnosis from photos
- Crop cultivation advice (planting, watering, fertilizing)
- Pest and disease identification and treatment
- Harvest timing and post-harvest handling
- Soil health and improvement
- Weather and seasonal farming tips

Keep responses practical, concise, and relevant to West African farming conditions.
Use simple language. When analyzing plant photos, describe what you see, identify potential issues, and suggest treatments available locally in Nigeria.
Always be encouraging and supportive.`;

// POST /ai/chat
router.post('/chat', authenticate, async (req: AuthRequest, res: Response) => {
  const { message, imageBase64, mimeType } = req.body;

  if (!message?.trim() && !imageBase64) {
    res.status(400).json({ error: 'message or image required' });
    return;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const parts: any[] = [{ text: SYSTEM_PROMPT + '\n\nFarmer: ' + (message?.trim() || 'Please analyze this plant image.') }];

    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg',
        },
      });
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();

    res.json({ reply: text });
  } catch (err: any) {
    console.error('[AI] Gemini error:', err?.message);
    res.status(500).json({ error: 'AI assistant unavailable. Please try again.' });
  }
});

export default router;
