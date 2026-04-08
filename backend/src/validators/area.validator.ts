import { z } from 'zod';

export const createFloorSchema = z.object({
  body: z.object({
    site_id: z.string().uuid(),
    name: z.string().min(1).max(255),
    level: z.number().int().optional(),
    description: z.string().optional()
  })
});

export const updateFloorSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    level: z.number().int().optional(),
    description: z.string().optional()
  })
});

export const createAreaSchema = z.object({
  body: z.object({
    floor_id: z.string().uuid(),
    name: z.string().min(1).max(255),
    type: z.enum(['washroom', 'food_court', 'corridor', 'parking', 'other']).optional(),
    description: z.string().optional()
  })
});

export const updateAreaSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    type: z.enum(['washroom', 'food_court', 'corridor', 'parking', 'other']).optional(),
    description: z.string().optional()
  })
});

export const createAreaChecklistScheduleSchema = z.object({
  body: z.object({
    checklist_template_id: z.string().uuid(),
    cron_expression: z.string().min(1),
    assigned_group_id: z.string().uuid().optional(),
    is_active: z.boolean().optional()
  })
});

export const updateAreaChecklistScheduleSchema = z.object({
  body: z.object({
    cron_expression: z.string().min(1).optional(),
    assigned_group_id: z.string().uuid().optional(),
    is_active: z.boolean().optional()
  })
});

export const verifyQrSchema = z.object({
  body: z.object({
    qr_code_hash: z.string().uuid()
  })
});