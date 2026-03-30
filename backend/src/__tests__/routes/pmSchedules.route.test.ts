import request from 'supertest';
import express from 'express';
import { pmScheduleService } from '../../services/pmSchedule.service';
import { createMockPMSchedule } from '../utils/testHelpers';

jest.mock('../../services/pmSchedule.service');
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

app.get('/pm-schedules', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await pmScheduleService.getAll(user.org_id, req.query as any);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/pm-schedules/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await pmScheduleService.getById(req.params.id, user.org_id);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.post('/pm-schedules', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await pmScheduleService.create(user.org_id, req.body, mockAudit);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.put('/pm-schedules/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await pmScheduleService.update(req.params.id, user.org_id, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.delete('/pm-schedules/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    await pmScheduleService.delete(req.params.id, user.org_id, mockAudit);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

describe('PM Schedules Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /pm-schedules', () => {
    it('should return paginated PM schedules', async () => {
      const mockPMs = [createMockPMSchedule(), createMockPMSchedule({ id: 'pm-456' })];
      (pmScheduleService.getAll as jest.Mock).mockResolvedValue({
        data: mockPMs,
        total: 2,
        skip: 0,
        limit: 100
      });

      const response = await request(app).get('/pm-schedules');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /pm-schedules/:id', () => {
    it('should return PM schedule by id', async () => {
      const mockPM = createMockPMSchedule();
      (pmScheduleService.getById as jest.Mock).mockResolvedValue(mockPM);

      const response = await request(app).get('/pm-schedules/pm-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('pm-123');
    });

    it('should return 404 for non-existent PM schedule', async () => {
      (pmScheduleService.getById as jest.Mock).mockRejectedValue({ statusCode: 404, message: 'Not found' });

      const response = await request(app).get('/pm-schedules/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /pm-schedules', () => {
    it('should create a new PM schedule', async () => {
      const newPM = createMockPMSchedule({ id: 'new-pm-123' });
      (pmScheduleService.create as jest.Mock).mockResolvedValue(newPM);

      const response = await request(app)
        .post('/pm-schedules')
        .send({ title: 'New PM', asset_id: 'asset-123', frequency_type: 'monthly' });

      expect(response.status).toBe(201);
    });
  });

  describe('PUT /pm-schedules/:id', () => {
    it('should update PM schedule', async () => {
      const updatedPM = createMockPMSchedule({ title: 'Updated PM' });
      (pmScheduleService.update as jest.Mock).mockResolvedValue(updatedPM);

      const response = await request(app)
        .put('/pm-schedules/pm-123')
        .send({ title: 'Updated PM' });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /pm-schedules/:id', () => {
    it('should delete PM schedule', async () => {
      (pmScheduleService.delete as jest.Mock).mockResolvedValue({ message: 'Deleted' });

      const response = await request(app).delete('/pm-schedules/pm-123');

      expect(response.status).toBe(204);
    });
  });
});