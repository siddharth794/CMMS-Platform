import { z } from 'zod';

export const CreateAssetSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    site_id: z.string().uuid().nullable().optional(),
    asset_tag: z.string().max(100).nullable().optional(),
    asset_type: z.enum(['movable', 'immovable']).default('movable'),
    category: z.string().max(100).nullable().optional(),
    description: z.string().nullable().optional(),
    location: z.string().max(255).nullable().optional(),
    manufacturer: z.string().max(255).nullable().optional(),
    model: z.string().max(255).nullable().optional(),
    serial_number: z.string().max(255).nullable().optional(),
    purchase_date: z.string().nullable().optional(),
    purchase_cost: z.string().max(50).nullable().optional(),
    warranty_expiry: z.string().nullable().optional(),
    status: z.string().max(50).default('active'),
    org_id: z.string().uuid().nullable().optional(),
}).strict();

export const UpdateAssetSchema = CreateAssetSchema.partial();

export const BulkDeleteSchema = z.object({
    ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
    force: z.boolean().optional(),
}).strict();
