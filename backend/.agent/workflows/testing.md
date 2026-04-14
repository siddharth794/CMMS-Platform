---
description: How to write and run tests for the CMMS backend
---
# Testing Workflow

## Test Stack
- **Jest** — test runner
- **Supertest** — HTTP endpoint testing
- **jest-mock-extended** — type-safe mocking
- Config: `jest.config.js` at project root

## Run Tests
```bash
npm test                    # run all tests
npm run test:watch          # watch mode
npm run test:coverage       # with coverage report
```
// turbo-all

## Test Directory
All tests go in `src/__tests__/`. Mirror the source structure:

```
src/__tests__/
  services/
    asset.service.test.ts
    workOrder.service.test.ts
  routes/
    assets.test.ts
  middleware/
    auth.test.ts
```

## Writing a Service Test

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the repository
jest.mock('../../repositories/entity.repository', () => ({
  default: {
    findAndCountAll: jest.fn(),
    findByIdAndOrg: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

import entityService from '../../services/entity.service';
import entityRepository from '../../repositories/entity.repository';

describe('EntityService', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  describe('getById', () => {
    it('should throw NotFoundError when entity does not exist', async () => {
      (entityRepository.findByIdAndOrg as jest.Mock).mockResolvedValue(null);
      await expect(entityService.getById('fake-id', 'org-id')).rejects.toThrow('not found');
    });

    it('should return entity when found', async () => {
      const mockEntity = { id: '1', name: 'Test', org_id: 'org-1' };
      (entityRepository.findByIdAndOrg as jest.Mock).mockResolvedValue(mockEntity);
      const result = await entityService.getById('1', 'org-1');
      expect(result).toEqual(mockEntity);
    });
  });
});
```

## Writing a Route/Integration Test

```typescript
import request from 'supertest';
import express from 'express';

// Set up test app with routes
const app = express();
app.use(express.json());
// ... mount routes with mock auth

describe('GET /api/entities', () => {
  it('should return 200 with paginated results', async () => {
    const res = await request(app).get('/api/entities').set('Authorization', 'Bearer test-token');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
  });
});
```

## Key Testing Rules
1. **Mock repositories in service tests** — don't hit the real database.
2. **Always clear mocks** in `beforeEach`.
3. **Test error cases** — NotFoundError, BadRequestError, ValidationError.
4. **Test org_id scoping** — ensure multi-tenancy is enforced.
5. **Test RBAC** — ensure unauthorized roles get 403.
