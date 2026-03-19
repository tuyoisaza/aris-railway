import { z } from 'zod';

export const schemas = {
    signup: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain an uppercase letter')
            .regex(/[0-9]/, 'Password must contain a number'),
        name: z.string().min(1).max(100).optional()
    }),
    login: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required')
    }),
    createFamily: z.object({
        userId: z.string().uuid('Invalid user ID'),
        name: z.string().min(1).max(100)
    }),
    invite: z.object({
        familyId: z.string().uuid('Invalid family ID'),
        email: z.string().email('Invalid email format'),
        userId: z.string().uuid('Invalid user ID')
    }),
    pin: z.object({
        familyId: z.string().uuid('Invalid family ID'),
        pin: z.string().length(4).regex(/^\d{4}$/, 'PIN must be 4 digits')
    }),
    checkout: z.object({
        userId: z.string().uuid('Invalid user ID'),
        priceId: z.string().min(1, 'Price ID is required')
    }),
    conversation: z.object({
        userId: z.string().uuid('Invalid user ID'),
        title: z.string().min(1).max(255).nullable().optional(),
        topicId: z.union([z.string().uuid(), z.null(), z.undefined()]).optional(),
        language: z.string().nullable().optional(),
        brief: z.string().nullable().optional(),
        initialContext: z.any().nullable().optional()
    }),
    message: z.object({
        conversationId: z.string().uuid('Invalid conversation ID'),
        role: z.enum(['user', 'ai', 'system']),
        content: z.string().min(1).max(10000)
    }),
    createProject: z.object({
        userId: z.string().uuid('Invalid user ID'),
        title: z.string().min(1),
        topicId: z.string().optional(),
        whyICare: z.string().optional(),
        intent: z.string().optional(),
        scope: z.string().optional(),
        doneWhen: z.string().optional()
    }),
    updateProject: z.object({
        title: z.string().optional(),
        status: z.enum(['idea', 'active', 'paused', 'completed']).optional(),
        whyICare: z.string().optional(),
        intent: z.string().optional(),
        scope: z.string().optional(),
        doneWhen: z.string().optional(),
        artifacts: z.array(z.any()).optional(),
        reflections: z.string().optional()
    }),
    summarize: z.object({
        conversationIds: z.array(z.string().uuid())
    }),
    createFolder: z.object({
        title: z.string().min(1)
    }),
    moveChat: z.object({
        folderId: z.string().nullable()
    })
};
