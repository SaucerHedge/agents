import { Router, Request, Response } from 'express';
import { agentMessenger } from '../agent/messaging';
import { MessageHistory } from '../types';

const router = Router();

interface ChatRequest {
  message: string;
  history?: MessageHistory[];
}

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [] }: ChatRequest = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`\n📨 Chat Request: "${message}"`);

    const response = await agentMessenger.processMessage(message, history);

    console.log(`\n✅ Chat Response: ${response.id}`);
    res.json(response);
  } catch (error: any) {
    console.error(`❌ Chat endpoint error:`, error);
    res.status(500).json({
      error: 'Failed to process message',
      message: error.message,
    });
  }
});

export default router;
