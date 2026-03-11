import { z } from 'zod';

export const CreateWorkOrderSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    description: z.string().max(5000).optional(),
    asset_id: z.string().uuid().nullable().optional().default(null),
    site_id: z.string().uuid().nullable().optional().default(null),
    assignee_id: z.string().uuid().nullable().optional().default(null),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    location: z.string().max(100).optional(),
    scheduled_start: z.string().optional(),
    scheduled_end: z.string().optional(),
    estimated_hours: z.number().int().positive().optional(),
}).strict();

export const UpdateWorkOrderSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).optional(),
    asset_id: z.string().uuid().nullable().optional(),
    site_id: z.string().uuid().nullable().optional(),
    assignee_id: z.string().uuid().nullable().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    status: z.enum(['new', 'open', 'in_progress', 'on_hold', 'pending_review', 'completed', 'cancelled']).optional(),
    location: z.string().max(100).optional(),
    scheduled_start: z.string().optional(),
    scheduled_end: z.string().optional(),
    estimated_hours: z.number().int().positive().optional(),
    actual_hours: z.number().int().positive().optional(),
    notes: z.string().max(5000).optional(),
}).strict();

export const StatusUpdateSchema = z.object({
    status: z.enum(['new', 'open', 'in_progress', 'on_hold', 'pending_review', 'completed', 'cancelled']),
    notes: z.string().max(5000).optional(),
}).strict();

export const AssignSchema = z.object({
    assignee_id: z.string().uuid('Invalid assignee ID'),
}).strict();

export const CommentSchema = z.object({
    message: z.string().min(1, 'Message is required').max(5000),
}).strict();

export const InventoryUsageSchema = z.object({
    inventory_item_id: z.string().uuid('Invalid inventory item ID'),
    quantity_used: z.number().int().positive('Quantity must be a positive integer'),
}).strict();

export const BulkDeleteSchema = z.object({
    ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
    force: z.boolean().optional(),
}).strict();
