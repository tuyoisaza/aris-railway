import express, { Request, Response } from 'express';
import { verifyAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';
import { AIService, ChatMessage } from '../services/ai';

const router = express.Router();

// Validation Schema
const chatSchema = z.object({
    body: z.object({
        mentorId: z.string(),
        messages: z.array(z.object({
            role: z.enum(['user', 'assistant', 'system']),
            content: z.string()
        })).min(1)
    })
});

// Stream Chat Endpoint
router.post('/', verifyAuth, validate(chatSchema), async (req: Request, res: Response) => {
    const { mentorId, messages } = req.body;

    // Set headers for SSE (Server-Sent Events) style streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    await AIService.smartStreamChat(
        mentorId,
        messages,
        (chunk) => {
            res.write(chunk);
        },
        () => {
            res.end();
        },
        (error) => {
            console.error("Chat Stream Error:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: error.message });
            } else {
                res.write(`\n\n[ERROR]: ${error.message}`);
                res.end();
            }
        }
    );
});

export default router;
