import { z } from 'zod';

export const CreateAccessSchema = z.object({
    name: z.string().min(1, 'Access name is required'),
    description: z.string().optional(),
    module: z.string().optional(),
}).strict();

export const UpdateAccessSchema = CreateAccessSchema.partial();
