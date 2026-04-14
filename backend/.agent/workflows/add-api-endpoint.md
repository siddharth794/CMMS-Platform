---
description: How to add API endpoints and wire up the route-controller-service-repository chain
---
# Adding API Endpoints

## Route → Controller → Service → Repository Pattern
Every API endpoint follows this exact chain. Never skip a layer.

## Step 1: Define the Route (`src/routes/<entity>.ts`)

```typescript
import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createEntity } from '../controllers/entity.controller';
import { createEntitySchema } from '../validators/entity.validator';

const router = Router();
router.use(authenticate); // all routes require auth

// Middleware chain: authenticate → requirePermission → validate → controller
router.get('/',                                                           getEntities);
router.get('/:id',                                                        getEntityById);
router.post('/',    requirePermission('entity:create'), validate(createEntitySchema), createEntity);
router.put('/:id',  requirePermission('entity:update'), validate(updateEntitySchema), updateEntity);
router.delete('/:id', requirePermission('entity:delete'),                              deleteEntity);
```

## Step 2: Register in `src/routes/index.ts`

```typescript
import entityRoutes from './entities';
router.use('/entities', entityRoutes);
```

## Step 3: Controller Pattern (`src/controllers/entity.controller.ts`)
Export named async arrow functions. Controllers ONLY parse requests and format responses:

```typescript
import { Request, Response, NextFunction } from 'express';
import entityService from '../services/entity.service';

export const getEntities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await entityService.getAll(req.user!.org_id, req.query);
    res.status(200).json(result);
  } catch (error) { next(error); }
};

export const createEntity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await entityService.create(req.user!.org_id, req.user!.id, req.body);
    res.status(201).json(result);
  } catch (error) { next(error); }
};
```

**CRITICAL**: No business logic or DB queries in controllers.

## Step 4: Service Pattern (`src/services/entity.service.ts`)
Class + singleton. Contains all business logic:

```typescript
import entityRepository from '../repositories/entity.repository';
import { auditService } from './audit.service';
import { NotFoundError, BadRequestError } from '../errors/AppError';

class EntityService {
  async create(orgId: string, userId: string, data: any) {
    const entity = await entityRepository.create({ ...data, org_id: orgId });
    auditService.log({ orgId, userId, userEmail: '', entityType: 'Entity', entityId: entity.id, action: 'create', newValues: data });
    return entity;
  }

  async getAll(orgId: string, query: any) {
    const { skip = 0, limit = 20, search, record_status } = query;
    const where: any = { org_id: orgId };
    // ... build where clause
    const result = await entityRepository.findAndCountAll(where, Number(skip), Number(limit));
    return { data: result.rows, total: result.count, skip: Number(skip), limit: Number(limit) };
  }

  async getById(id: string, orgId: string) {
    const entity = await entityRepository.findByIdAndOrg(id, orgId);
    if (!entity) throw new NotFoundError('Entity');
    return entity;
  }
}
export default new EntityService();
```

## Step 5: Repository Pattern (`src/repositories/entity.repository.ts`)
All Sequelize queries go here:

```typescript
import { Entity, sequelize } from '../models';

const ENTITY_INCLUDES = [/* reusable association includes */];

class EntityRepository {
  async findAndCountAll(where: any, skip: number, limit: number, paranoid = true) {
    return Entity.findAndCountAll({
      where, include: ENTITY_INCLUDES,
      offset: skip, limit, order: [['created_at', 'DESC']],
      distinct: true, paranoid
    });
  }

  async findByIdAndOrg(id: string, orgId: string) {
    return Entity.findOne({ where: { id, org_id: orgId }, include: ENTITY_INCLUDES });
  }

  async create(data: any, transaction?: any) {
    return Entity.create(data, { transaction });
  }
}
export default new EntityRepository();
```

**CRITICAL**: Always scope queries by `org_id` for multi-tenancy.

## Error Types (from `src/errors/AppError.ts`)
| Error | Status | Usage |
|---|---|---|
| `BadRequestError` | 400 | Invalid input, business rule violation |
| `ValidationError` | 400 | Zod schema failures |
| `UnauthorizedError` | 401 | Missing/invalid token |
| `ForbiddenError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Entity not found |
| `ConflictError` | 409 | Duplicate resource |
| `InternalError` | 500 | Unexpected server errors |

## Response Patterns
- **List**: `{ data: T[], total: number, skip: number, limit: number }`
- **Single**: raw entity JSON
- **Create**: 201 status + created entity
- **Update**: 200 status + updated entity
- **Delete**: `{ message: 'Entity deactivated (soft delete)' }` or `{ message: 'Entity permanently deleted' }`
