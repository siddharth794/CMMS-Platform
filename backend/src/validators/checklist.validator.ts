import { z } from 'zod';

export const createChecklistSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').max(255),
        description: z.string().optional(),
        is_required: z.boolean().optional(),
        asset_id: z.string().uuid('Invalid Asset ID').optional(),
        pm_schedule_id: z.string().uuid('Invalid PM Schedule ID').optional(),
        items: z.array(z.object({
            description: z.string().min(1, 'Item description is required').max(500),
            order_index: z.number().int().min(0).default(0)
        })).optional()
    })
});

export const updateChecklistSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        is_required: z.boolean().optional()
    })
});

export const addChecklistItemSchema = z.object({
    body: z.object({
        description: z.string().min(1, 'Item description is required').max(500),
        order_index: z.number().int().min(0).default(0)
    })
});

export const toggleChecklistItemSchema = z.object({
    body: z.object({
        is_completed: z.boolean()
    })
});

export const updateChecklistItemSchema = z.object({
    body: z.object({
        description: z.string().min(1).max(500).optional(),
        order_index: z.number().int().min(0).optional(),
        notes: z.string().optional()
    })
});
