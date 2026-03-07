import { z } from 'zod';

export const CreateGroupSchema = z.object({
    name: z.string().min(1, 'Group name is required').max(100),
    description: z.string().max(500).optional(),
}).strict();

export const UpdateGroupSchema = CreateGroupSchema.partial();

export const UpdateGroupMembersSchema = z.object({
    user_ids: z.array(z.string().uuid()),
}).strict();

export const UpdateGroupRolesSchema = z.object({
    role_ids: z.array(z.number()),
}).strict();
