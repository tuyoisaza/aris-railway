import { z } from 'zod';

export const inviteSchema = z.object({
    body: z.object({
        code: z.string().min(1, "Invite code is required").max(50, "Invite code too long")
    })
});

export const journalSchema = z.object({
    body: z.object({
        decision: z.string().min(1).max(255),
        context: z.string().min(1).max(2000),
        outcome: z.string().max(2000).optional(),
        reviewDate: z.string().datetime().optional()
    })
});

export const progressSchema = z.object({
    body: z.object({
        axis: z.string().uuid("Invalid Axis ID"),
        data: z.object({
            score: z.number().min(0).max(100),
            levelTitle: z.string().max(100),
            completedAt: z.string().optional() // Optional as it might be set by server or client
        })
    })
});

export const courseStepSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid Course ID"),
        stepIndex: z.string().regex(/^\d+$/, "Step index must be a number")
    })
});
