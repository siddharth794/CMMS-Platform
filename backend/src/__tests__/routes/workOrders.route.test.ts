import request from 'supertest';
import express from 'express';
import { workOrderService } from '../../services/workOrder.service';
import { createMockWorkOrder, createPaginatedResponse } from '../utils/testHelpers';

jest.mock('../../services/workOrder.service');
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

app.get('/work-orders', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await workOrderService.getAll(
      user.org_id,
      user.id,
      'admin',
      req.query as any
    );
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/work-orders/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await workOrderService.getById(req.params.id, user.org_id);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.post('/work-orders', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await workOrderService.create(user.org_id, user.id, req.body, mockAudit);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.put('/work-orders/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await workOrderService.update(req.params.id, user.org_id, req.body, mockAudit);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.delete('/work-orders/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    await workOrderService.delete(req.params.id, user.org_id, mockAudit);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.post('/work-orders/:id/status', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await workOrderService.updateStatus(req.params.id, user.org_id, req.body, user, mockAudit);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.post('/work-orders/:id/assign', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await workOrderService.assign(req.params.id, user.org_id, req.body, mockAudit);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

describe('Work Orders Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /work-orders', () => {
    it('should return paginated work orders', async () => {
      const mockWOs = [createMockWorkOrder(), createMockWorkOrder({ id: 'wo-456' })];
      (workOrderService.getAll as jest.Mock).mockResolvedValue({
        data: mockWOs,
        total: 2,
        skip: 0,
        limit: 100
      });

      const response = await request(app).get('/work-orders');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);
    });

    it('should filter work orders by status', async () => {
      (workOrderService.getAll as jest.Mock).mockResolvedValue({ data: [], total: 0, skip: 0, limit: 100 });

      const response = await request(app).get('/work-orders?status=pending');

      expect(workOrderService.getAll).toHaveBeenCalledWith(
        'org-123',
        'user-123',
        'admin',
        expect.objectContaining({ status: 'pending' })
      );
      expect(response.status).toBe(200);
    });

    it('should handle pagination parameters', async () => {
      (workOrderService.getAll as jest.Mock).mockResolvedValue({ data: [], total: 0, skip: 20, limit: 20 });

      const response = await request(app).get('/work-orders?skip=20&limit=20');

      expect(workOrderService.getAll).toHaveBeenCalledWith(
        'org-123',
        'user-123',
        'admin',
        expect.objectContaining({ skip: '20', limit: '20' })
      );
      expect(response.status).toBe(200);
    });
  });

  describe('GET /work-orders/:id', () => {
    it('should return work order by id', async () => {
      const mockWO = createMockWorkOrder();
      (workOrderService.getById as jest.Mock).mockResolvedValue(mockWO);

      const response = await request(app).get('/work-orders/wo-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('wo-123');
    });

    it('should return 404 for non-existent work order', async () => {
      (workOrderService.getById as jest.Mock).mockRejectedValue({ statusCode: 404, message: 'Not found' });

      const response = await request(app).get('/work-orders/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /work-orders', () => {
    it('should create a new work order', async () => {
      const newWO = createMockWorkOrder({ id: 'new-wo-123' });
      (workOrderService.create as jest.Mock).mockResolvedValue(newWO);

      const response = await request(app)
        .post('/work-orders')
        .send({ title: 'New Work Order', description: 'Test', priority: 'high', site_id: 'site-123' });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('new-wo-123');
    });

    it('should return 400 for invalid data', async () => {
      (workOrderService.create as jest.Mock).mockRejectedValue({ statusCode: 400, message: 'Invalid data' });

      const response = await request(app)
        .post('/work-orders')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /work-orders/:id', () => {
    it('should update work order', async () => {
      const updatedWO = createMockWorkOrder({ title: 'Updated Title' });
      (workOrderService.update as jest.Mock).mockResolvedValue(updatedWO);

      const response = await request(app)
        .put('/work-orders/wo-123')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
    });
  });

  describe('DELETE /work-orders/:id', () => {
    it('should delete work order', async () => {
      (workOrderService.delete as jest.Mock).mockResolvedValue({ message: 'Deleted' });

      const response = await request(app).delete('/work-orders/wo-123');

      expect(response.status).toBe(204);
    });
  });

  describe('POST /work-orders/:id/status', () => {
    it('should update work order status', async () => {
      const updatedWO = createMockWorkOrder({ status: 'in_progress' });
      (workOrderService.updateStatus as jest.Mock).mockResolvedValue(updatedWO);

      const response = await request(app)
        .post('/work-orders/wo-123/status')
        .send({ status: 'in_progress' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('in_progress');
    });
  });

  describe('POST /work-orders/:id/assign', () => {
    it('should assign work order to technician', async () => {
      const assignedWO = createMockWorkOrder({ assignee_id: 'tech-123' });
      (workOrderService.assign as jest.Mock).mockResolvedValue(assignedWO);

      const response = await request(app)
        .post('/work-orders/wo-123/assign')
        .send({ assignee_id: 'tech-123' });

      expect(response.status).toBe(200);
      expect(response.body.assignee_id).toBe('tech-123');
    });
  });
});