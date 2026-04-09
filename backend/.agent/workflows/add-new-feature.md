---
description: How to add a complete new feature (CRUD entity) to the CMMS backend
---
# Adding a New Feature / CRUD Entity

Follow this layered workflow exactly — every feature must touch all layers. Never skip a layer.

## Step 1: Database Migration
Create the table via a migration (see `/database-schema-changes` workflow).

```bash
npx sequelize-cli migration:generate --name create-<entity>-table
```
// turbo

Write `up` (createTable) and `down` (dropTable) logic in the generated file at `src/migrations/`.

## Step 2: Model (`src/models/index.ts`)
Add the model class and init call to the single models file:

```typescript
class NewEntity extends Model {
  public id!: string;
  public org_id!: string;
  // ... all typed public fields
}
NewEntity.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  org_id: { type: DataTypes.UUID, allowNull: false },
  // ... columns matching migration exactly
}, {
  sequelize,
  tableName: 'new_entities',  // snake_case plural
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  paranoid: true,
  deletedAt: 'deleted_at'
});
```

Add associations at the bottom of the same file, then add to the `export { }` block.

## Step 3: DTO Types (`src/types/dto.ts`)
Add Create, Update, and ListQuery interfaces:

```typescript
export interface CreateNewEntityDTO { name: string; org_id?: string; /* ... */ }
export interface UpdateNewEntityDTO { name?: string; /* ... */ }
export interface NewEntityListQuery { skip?: number; limit?: number; search?: string; record_status?: string; }
```

## Step 4: Validator (`src/validators/newEntity.validator.ts`)
Create a Zod schema file:

```typescript
import { z } from 'zod';
export const createNewEntitySchema = z.object({ name: z.string().min(1).max(255), /* ... */ });
export const updateNewEntitySchema = createNewEntitySchema.partial();
```

## Step 5: Repository (`src/repositories/newEntity.repository.ts`)
Create a repository with reusable include arrays:

```typescript
import { NewEntity, sequelize } from '../models';

const INCLUDES = [/* association includes */];

class NewEntityRepository {
  async findAndCountAll(where: any, skip: number, limit: number, paranoid = true) { /* ... */ }
  async findByIdAndOrg(id: string, orgId: string) { /* ... */ }
  async create(data: any, transaction?: any) { /* ... */ }
  async update(id: string, orgId: string, data: any) { /* ... */ }
  async delete(id: string, orgId: string, force = false) { /* ... */ }
  async restore(id: string, orgId: string) { /* ... */ }
}
export default new NewEntityRepository();
```

**CRITICAL**: Always scope queries by `org_id` for multi-tenancy.

## Step 6: Service (`src/services/newEntity.service.ts`)
Create the business logic layer:

```typescript
import newEntityRepository from '../repositories/newEntity.repository';
import { NotFoundError, BadRequestError } from '../errors/AppError';

class NewEntityService {
  async create(orgId: string, userId: string, data: any) { /* ... */ }
  async getAll(orgId: string, query: any) { /* ... return { data, total, skip, limit } */ }
  async getById(id: string, orgId: string) { /* ... throw NotFoundError if null */ }
  async update(id: string, orgId: string, data: any) { /* ... */ }
  async delete(id: string, orgId: string, force = false) { /* ... */ }
}
export default new NewEntityService();
```

- Call `auditService.log()` after every mutating operation (fire-and-forget).
- Throw typed errors from `src/errors/AppError.ts`.

## Step 7: Controller (`src/controllers/newEntity.controller.ts`)
Export named arrow functions — no business logic here:

```typescript
import { Request, Response, NextFunction } from 'express';
import newEntityService from '../services/newEntity.service';

export const createNewEntity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await newEntityService.create(req.user!.org_id, req.user!.id, req.body);
    res.status(201).json(result);
  } catch (error) { next(error); }
};
```

## Step 8: Route (`src/routes/newEntities.ts`)
Wire middleware chain: `authenticate` → `requirePermission` → `validate` → controller:

```typescript
import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createNewEntity, /* ... */ } from '../controllers/newEntity.controller';
import { createNewEntitySchema } from '../validators/newEntity.validator';

const router = Router();
router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', requirePermission('new_entity:create'), validate(createNewEntitySchema), createNewEntity);
router.put('/:id', requirePermission('new_entity:update'), validate(updateNewEntitySchema), updateById);
router.delete('/:id', requirePermission('new_entity:delete'), deleteById);

export default router;
```

## Step 9: Register Route (`src/routes/index.ts`)
Add the import and `router.use('/new-entities', newEntityRoutes);`.

## Step 10: Permissions (`src/constants/permissions.ts`)
Add new permissions to the `PERMISSIONS` array and map them to roles in `DEFAULT_ROLE_PERMISSIONS`.

## Step 11: Run Migration & Test
```bash
npm run migrate
npm run dev
```
// turbo
