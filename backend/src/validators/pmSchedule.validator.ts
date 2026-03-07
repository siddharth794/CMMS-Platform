import { z } from 'zod';

export const CreatePMScheduleSchema = z.object({
    asset_id: z.string().uuid('Invalid asset ID'),
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(5000).optional(),
    frequency_type: z.string().max(50).default('days'),
    frequency_value: z.number().int().positive('Frequency value must be positive'),
    priority: z.string().max(50).default('medium'),
    estimated_hours: z.number().int().positive().optional(),
    next_due: z.string().min(1, 'Next due date is required'),
}).strict();

export const UpdatePMScheduleSchema = CreatePMScheduleSchema.partial();
