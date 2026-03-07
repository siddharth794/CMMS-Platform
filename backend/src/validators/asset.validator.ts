import { z } from 'zod';

export const CreateAssetSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    asset_tag: z.string().max(100).optional(),
    asset_type: z.enum(['movable', 'immovable']).default('movable'),
    category: z.string().max(100).optional(),
    description: z.string().optional(),
    location: z.string().max(255).optional(),
    manufacturer: z.string().max(255).optional(),
    model: z.string().max(255).optional(),
    serial_number: z.string().max(255).optional(),
    purchase_date: z.string().optional(),
    purchase_cost: z.string().max(50).optional(),
    warranty_expiry: z.string().optional(),
    status: z.string().max(50).default('active'),
}).strict();

export const UpdateAssetSchema = CreateAssetSchema.partial();

export const BulkDeleteSchema = z.object({
    ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
    force: z.boolean().optional(),
}).strict();
