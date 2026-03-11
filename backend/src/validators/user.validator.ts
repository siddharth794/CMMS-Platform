import { z } from 'zod';

export const CreateUserSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role_id: z.number().int().positive('Invalid role ID'),
    username: z.string().min(1).max(100),
    first_name: z.string().max(100).optional(),
    last_name: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    org_id: z.string().uuid().optional(),
    site_id: z.string().uuid().nullable().optional(),
}).strict();

export const UpdateUserSchema = z.object({
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role_id: z.number().int().positive().optional(),
    username: z.string().min(1).max(100).optional(),
    first_name: z.string().max(100).optional(),
    last_name: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    is_active: z.boolean().optional(),
    site_id: z.string().uuid().nullable().optional(),
}).strict();

export const BulkDeleteSchema = z.object({
    ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
    force: z.boolean().optional(),
}).strict();
