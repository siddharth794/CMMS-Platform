---
description: How to handle errors, throw typed errors, and use the centralized error handler
---
# Error Handling Workflow

## Error Classes (`src/errors/AppError.ts`)
All errors extend `AppError`. The centralized error handler in `src/middleware/errorHandler.ts` serializes them.

| Class | Status | When to Use |
|---|---|---|
| `BadRequestError(message)` | 400 | Invalid input, business rule violation |
| `ValidationError(message, errors[])` | 400 | Zod validation failures (handled by validate middleware) |
| `UnauthorizedError(message)` | 401 | Missing or invalid JWT token |
| `ForbiddenError(message)` | 403 | Valid token but insufficient permissions |
| `NotFoundError(entityName)` | 404 | Entity not found — message becomes `"<entityName> not found"` |
| `ConflictError(message)` | 409 | Duplicate resource (e.g., unique constraint) |
| `TooManyRequestsError(message)` | 429 | Rate limiting |
| `InternalError(message)` | 500 | Unexpected errors (`isOperational = false`) |

## Usage in Service Layer
```typescript
import { NotFoundError, BadRequestError, ConflictError } from '../errors/AppError';

// Not found
const entity = await repository.findById(id, orgId);
if (!entity) throw new NotFoundError('Asset');

// Business rule violation
if (workOrder.status === 'completed') {
  throw new BadRequestError('Cannot modify a completed work order');
}

// Duplicate check
const existing = await repository.findByName(name, orgId);
if (existing) throw new ConflictError('An asset with this name already exists');
```

## Controller Error Pattern
Controllers use try/catch and pass errors to `next()`:

```typescript
export const createEntity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await entityService.create(req.user!.org_id, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error); // Centralized error handler takes over
  }
};
```

**NEVER** catch errors in controllers to return custom responses — always use `next(error)`.

## Audit Logging (Fire-and-Forget)
Use `auditService.log()` after mutating operations. It never throws — failures are silently logged:

```typescript
import { auditService } from './audit.service';

// After create/update/delete in service layer:
auditService.log({
  orgId, userId, userEmail,
  entityType: 'WorkOrder',
  entityId: workOrder.id,
  action: 'create',        // 'create' | 'update' | 'delete' | 'status_change' | 'assign' | ...
  oldValues: undefined,
  newValues: data
});
```
