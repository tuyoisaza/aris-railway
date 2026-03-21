import { z } from 'zod';

export const schemas = {
    conversation: z.object({
        userId: z.string(),
        title: z.string().optional(),
        topicId: z.string().optional().nullable(),
        language: z.string().default('en')
    }),
    message: z.object({
        conversationId: z.string(),
        role: z.enum(['user', 'assistant', 'system', 'ai']),
        content: z.string()
    }),
    summarize: z.object({
        conversationIds: z.array(z.string())
    }),
    moveChat: z.object({
        folderId: z.string().nullable()
    }),
    createFamily: z.object({
        userId: z.string(),
        name: z.string()
    }),
    invite: z.object({
        familyId: z.string(),
        email: z.string().email(),
        userId: z.string()
    }),
    pin: z.object({
        familyId: z.string(),
        pin: z.string().length(4).optional()
    })
};
