import request from 'supertest';
import express from 'express';
import { inventoryService } from '../../services/inventory.service';
import { createMockInventory } from '../utils/testHelpers';

jest.mock('../../services/inventory.service');
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  fatal: jest.fn(),
  error: jest.fn(),
}));

const app = express();
app.use(express.json());

const mockUser: any = {
  id: 'user-123',
  org_id: 'org-123',
  email: 'test@example.com',
  Role: { id: 1, name: 'admin' },
  effectiveRoles: [{ id: 1, name: 'admin' }],
  effectiveAccesses: [],
};

const mockAudit = { orgId: 'org-123', userId: 'user-123', userEmail: 'test@example.com' };

app.use((req: any, _res, next) => {
  req.user = mockUser;
  next();
});

app.get('/inventory', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await inventoryService.getAll(user.org_id, req.query as any);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/inventory/stats', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await inventoryService.getStats(user.org_id, req.query as any);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/inventory/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await inventoryService.getById(req.params.id, user.org_id);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.post('/inventory', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await inventoryService.create(req.body, user.org_id, mockAudit);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.put('/inventory/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await inventoryService.update(req.params.id, user.org_id, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.delete('/inventory/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    await inventoryService.delete(req.params.id, user.org_id, mockAudit);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/inventory/stats', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await inventoryService.getStats(user.org_id, req.query as any);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

describe('Inventory Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /inventory', () => {
    it('should return paginated inventory items', async () => {
      const mockItems = [createMockInventory(), createMockInventory({ id: 'inv-456' })];
      (inventoryService.getAll as jest.Mock).mockResolvedValue({
        data: mockItems,
        total: 2,
        skip: 0,
        limit: 100
      });

      const response = await request(app).get('/inventory');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by category', async () => {
      (inventoryService.getAll as jest.Mock).mockResolvedValue({ data: [], total: 0, skip: 0, limit: 100 });

      const response = await request(app).get('/inventory?category=parts');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /inventory/:id', () => {
    it('should return inventory item by id', async () => {
      const mockItem = createMockInventory();
      (inventoryService.getById as jest.Mock).mockResolvedValue(mockItem);

      const response = await request(app).get('/inventory/inv-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('inv-123');
    });

    it('should return 404 for non-existent item', async () => {
      (inventoryService.getById as jest.Mock).mockRejectedValue({ statusCode: 404, message: 'Not found' });

      const response = await request(app).get('/inventory/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /inventory', () => {
    it('should create a new inventory item', async () => {
      const newItem = createMockInventory({ id: 'new-inv-123' });
      (inventoryService.create as jest.Mock).mockResolvedValue(newItem);

      const response = await request(app)
        .post('/inventory')
        .send({ name: 'New Part', sku: 'SKU-999', quantity: 10, site_id: 'site-123' });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('new-inv-123');
    });
  });

  describe('PUT /inventory/:id', () => {
    it('should update inventory item', async () => {
      const updatedItem = createMockInventory({ name: 'Updated Part' });
      (inventoryService.update as jest.Mock).mockResolvedValue(updatedItem);

      const response = await request(app)
        .put('/inventory/inv-123')
        .send({ name: 'Updated Part' });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /inventory/:id', () => {
    it('should delete inventory item', async () => {
      (inventoryService.delete as jest.Mock).mockResolvedValue({ message: 'Deleted' });

      const response = await request(app).delete('/inventory/inv-123');

      expect(response.status).toBe(204);
    });
  });

  describe('GET /inventory/stats', () => {
    it('should return inventory stats', async () => {
      (inventoryService.getStats as jest.Mock).mockResolvedValue({ total_items: 100, total_value: 5000, low_stock_count: 5 });

      const response = await request(app).get('/inventory/stats');

      expect(response.status).toBe(200);
    });
  });
});