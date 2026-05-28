import { Router, Request, Response } from 'express';
import { getGeminiClient } from '../services/aiGenerator';

const router = Router();

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  context?: string; // Optional context about the current assignment/subject
}

// Chat endpoint
router.post('/', async (req: Request, res: Response) => {
  try {
    const { messages, context } = req.body as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Add system context if provided
    const systemMessage: ChatMessage = context
      ? {
          role: 'system',
          content: `You are a helpful AI tutor assisting with ${context}. Provide clear, educational responses that help students understand the subject matter better.`,
        }
      : {
          role: 'system',
          content: 'You are a helpful AI tutor. Provide clear, educational responses that help students understand the subject matter better.',
        };

    const allMessages = [systemMessage, ...messages];

    try {
      const model = getGeminiClient().getGenerativeModel({ model: 'gemini-1.0-pro' });
      const prompt = allMessages.map(m => `${m.role}: ${m.content}`).join('\n');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const chatResponse = response.text();

      res.json({
        success: true,
        response: chatResponse,
      });
    } catch (error: any) {
      // If OpenAI fails, return a fallback response
      console.error('OpenAI Chat Error:', error.message);
      
      const fallbackResponses = [
        "I'm sorry, I'm having trouble connecting to my AI services right now. Please try again later.",
        "Due to API limitations, I can't provide a detailed response at the moment. Please check your OpenAI API quota.",
        "I'm experiencing technical difficulties. Please try again or contact support.",
      ];
      
      const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      res.json({
        success: true,
        response: randomFallback,
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;
