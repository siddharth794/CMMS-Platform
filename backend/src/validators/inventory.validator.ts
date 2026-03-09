import { z } from 'zod';

export const CreateInventoryItemSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().optional(),
    sku: z.string().max(100).optional(),
    category: z.string().min(1, 'Category is required').max(100),
    quantity: z.number().int().min(0).default(0),
    min_quantity: z.number().int().min(0).default(0),
    unit: z.string().max(50).default('pcs'),
    unit_cost: z.string().max(50).default('0'),
    storage_location: z.string().min(1, 'Storage location is required').max(255),
}).strict();

export const UpdateInventoryItemSchema = CreateInventoryItemSchema.partial();

export const BulkDeleteSchema = z.object({
    ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
    force: z.boolean().optional(),
}).strict();

export const BulkCreateInventorySchema = z.object({
    items: z.array(z.object({
        name: z.string().min(1, 'Name is required').max(255),
        description: z.string().optional().nullable(),
        sku: z.string().max(100).optional().nullable(),
        category: z.string().min(1, 'Category is required').max(100),
        quantity: z.number().min(0).default(0),
        min_quantity: z.number().min(0).default(0),
        unit: z.string().max(50).default('pcs'),
        unit_cost: z.number().min(0).default(0),
        storage_location: z.string().min(1, 'Storage location is required').max(255),
    })).min(1, 'At least one item is required')
}).strict();
