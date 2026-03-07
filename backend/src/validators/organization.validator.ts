import { z } from 'zod';

export const CreateOrganizationSchema = z.object({
    name: z.string().min(1, 'Organization name is required').max(255),
    description: z.string().max(5000).optional(),
    address: z.string().max(1000).optional(),
}).strict();
