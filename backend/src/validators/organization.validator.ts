import { z } from 'zod';

export const CreateOrganizationSchema = z.object({
    name: z.string().min(1, 'Organization name is required').max(255),
    description: z.string().max(5000).optional(),
    address: z.string().max(1000).optional(),
    owner_name: z.string().max(255).optional(),
    website_url: z.string().url('Invalid website URL').or(z.string().length(0)).optional(),
    email: z.string().email('Invalid email address').or(z.string().length(0)).optional(),
    phone: z.string().max(20).optional(),
    is_active: z.boolean().optional(),
}).strict();

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();
