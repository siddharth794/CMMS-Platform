import { z } from 'zod';

export const CreateRoleSchema = z.object({
    name: z.string().min(1, 'Role name is required').max(100),
    description: z.string().max(500).optional(),
    permissions: z.record(z.string(), z.any()).default({}),
}).strict();

export const UpdateRoleSchema = CreateRoleSchema.partial();
