---
description: How to add Zod validation schemas for API request bodies and query params
---
# Validation Workflow

## Overview
Request validation uses **Zod** schemas applied via the `validate` middleware. All schemas live in `src/validators/`.

## Step 1: Create Validator File (`src/validators/<entity>.validator.ts`)

```typescript
import { z } from 'zod';

// Create schema — required fields + optional fields
export const createEntitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  category: z.string().min(1).max(100),
  is_active: z.boolean().optional().default(true),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  asset_id: z.string().uuid('Invalid Asset ID').nullable().optional(),
  quantity: z.number().int().min(0).optional().default(0),
});

// Update schema — all fields optional
export const updateEntitySchema = createEntitySchema.partial();
// OR define explicitly for different rules:
export const updateEntitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});
```

## Step 2: Apply in Route

```typescript
import { validate } from '../middleware/validate';
import { createEntitySchema, updateEntitySchema } from '../validators/entity.validator';

router.post('/', requirePermission('entity:create'), validate(createEntitySchema), createEntity);
router.put('/:id', requirePermission('entity:update'), validate(updateEntitySchema), updateEntity);
```

## How `validate` Middleware Works (`src/middleware/validate.ts`)
1. Parses `req.body` against the Zod schema
2. On success: replaces `req.body` with validated/whitelisted data (strips unknown fields)
3. On failure: returns 400 with field-level errors:
```json
{ "detail": "Validation failed", "errors": { "name": ["Required"], "quantity": ["Expected number, received string"] } }
```

## Common Zod Patterns Used in This Project

```typescript
// UUID foreign keys (nullable + optional)
asset_id: z.string().uuid('Invalid Asset ID').nullable().optional(),

// Enums
status: z.enum(['new', 'open', 'in_progress', 'on_hold', 'completed', 'cancelled']),
priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),

// Nested arrays (e.g., checklist items)
items: z.array(z.object({
  description: z.string().min(1).max(500),
  order_index: z.number().int().min(0).default(0),
})).optional(),

// Boolean with default
is_template: z.boolean().optional().default(false),

// Nested objects (e.g., PM schedule triggers)
triggers: z.array(z.object({
  trigger_type: z.enum(['TIME', 'METER']).optional().default('TIME'),
  cron_expression: z.string().optional(),
  meter_interval: z.number().int().optional(),
})),
```

## Naming Convention
- File: `<entity>.validator.ts` (camelCase entity name)
- Schemas: `create<Entity>Schema`, `update<Entity>Schema`
- Additional schemas: `add<SubEntity>Schema`, `toggle<Feature>Schema`
