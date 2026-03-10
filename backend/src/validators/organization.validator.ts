import { z } from 'zod';

export const CreateOrganizationSchema = z.object({
    name: z.string().min(1, 'Organization name is required').max(255),
    description: z.string().max(5000).optional().nullable(),
    address: z.string().max(1000).optional().nullable(),
    owner_name: z.string().max(255).optional().nullable(),
    website_url: z.string().url('Invalid website URL').or(z.string().length(0)).optional().nullable(),
    email: z.string().email('Invalid email address').or(z.string().length(0)).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    is_active: z.boolean().optional(),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();
