import { z } from 'zod';

export const CreateSiteSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    address: z.string().optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(100).optional(),
    zip_code: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional().default(true),
    manager_id: z.string().uuid().nullable().optional(),
    org_id: z.string().uuid().optional(),
}).strict();

export const UpdateSiteSchema = CreateSiteSchema.omit({ org_id: true }).partial();

export const AssignManagerSchema = z.object({
    manager_id: z.string().uuid().nullable(),
}).strict();

export const AssignTechnicianSchema = z.object({
    // user_id is coming from params
});

export const BulkDeleteSchema = z.object({
    ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
    force: z.boolean().optional(),
}).strict();
