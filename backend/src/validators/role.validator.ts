import { z } from 'zod';

export const CreateRoleSchema = z.object({
    name: z.string().min(1, 'Role name is required').max(100),
    description: z.string().max(500).optional(),
}).strict();

export const UpdateRoleSchema = CreateRoleSchema.partial();

export const UpdateRoleAccessesSchema = z.object({
    access_ids: z.array(z.string().uuid()),
}).strict();
