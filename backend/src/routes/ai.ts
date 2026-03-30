import { Router, Response } from 'express';
import Groq from 'groq-sdk';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are FarmLink's agricultural assistant for smallholder farmers in Nigeria.
You help farmers with:
- Crop cultivation advice (planting, watering, fertilizing)
- Pest and disease identification and treatment
- Harvest timing and post-harvest handling
- Soil health and improvement
- Weather and seasonal farming tips
- Market pricing guidance

Keep responses practical, concise, and relevant to West African farming conditions.
Use simple language. Suggest treatments and inputs available locally in Nigeria.
Always be encouraging and supportive.`;

router.post('/chat', authenticate, async (req: AuthRequest, res: Response) => {
  const { message } = req.body;

  if (!message?.trim()) {
    res.status(400).json({ error: 'message required' });
    return;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message.trim() },
      ],
      max_tokens: 512,
    });

    const text = completion.choices[0]?.message?.content ?? 'No response.';
    res.json({ reply: text });
  } catch (err: any) {
    console.error(err?.message);
    res.status(500).json({ error: 'AI assistant unavailable. Please try again.' });
  }
});

export default router;
