import { z } from 'zod';

export const CreatePMScheduleSchema = z.object({
    org_id: z.string().uuid('Invalid organization ID').optional(),
    site_id: z.string().uuid('Invalid site ID').optional(),
    asset_id: z.string().uuid('Invalid asset ID'),
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(5000).optional(),
    schedule_logic: z.enum(['FIXED', 'FLOATING']).default('FIXED'),
    is_paused: z.boolean().default(false),
    
    triggers: z.array(z.object({
        trigger_type: z.enum(['TIME', 'METER']).default('TIME'),
        cron_expression: z.string().max(100).optional(),
        meter_interval: z.number().int().positive().optional(),
        lead_time_days: z.number().int().min(0).default(7)
    })).min(1, 'At least one trigger is required'),

    template: z.object({
        priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        estimated_hours: z.number().int().positive().optional(),
        assignee_id: z.string().uuid().optional().nullable()
    }),

    tasks: z.array(z.object({
        description: z.string().min(1, 'Task description cannot be empty')
    })).optional(),

    parts: z.array(z.object({
        inventory_item_id: z.string().uuid(),
        quantity_required: z.number().int().positive()
    })).optional()
}).strict();

export const UpdatePMScheduleSchema = CreatePMScheduleSchema.partial();
