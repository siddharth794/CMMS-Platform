import request from 'supertest';
import express from 'express';
import { siteService } from '../../services/site.service';
import { createMockSite } from '../utils/testHelpers';

jest.mock('../../services/site.service');
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

app.get('/sites', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await siteService.getAll(user.org_id, req.query as any);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/sites/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await siteService.getById(req.params.id, user.org_id);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.post('/sites', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await siteService.create(req.body, user, mockAudit);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.put('/sites/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await siteService.update(req.params.id, req.body, user, mockAudit);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.delete('/sites/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    await siteService.delete(req.params.id, user, mockAudit);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

describe('Sites Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /sites', () => {
    it('should return paginated sites', async () => {
      const mockSites = [createMockSite(), createMockSite({ id: 'site-456' })];
      (siteService.getAll as jest.Mock).mockResolvedValue({
        rows: mockSites,
        count: 2,
        currentPage: 1,
        totalPages: 1,
        limit: 10
      });

      const response = await request(app).get('/sites');

      expect(response.status).toBe(200);
      expect(response.body.rows).toHaveLength(2);
    });
  });

  describe('GET /sites/:id', () => {
    it('should return site by id', async () => {
      const mockS = createMockSite();
      (siteService.getById as jest.Mock).mockResolvedValue(mockS);

      const response = await request(app).get('/sites/site-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('site-123');
    });

    it('should return 404 for non-existent site', async () => {
      (siteService.getById as jest.Mock).mockRejectedValue({ statusCode: 404, message: 'Not found' });

      const response = await request(app).get('/sites/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /sites', () => {
    it('should create a new site', async () => {
      const newSite = createMockSite({ id: 'new-site-123' });
      (siteService.create as jest.Mock).mockResolvedValue(newSite);

      const response = await request(app)
        .post('/sites')
        .send({ name: 'New Site', address: '123 Test St' });

      expect(response.status).toBe(201);
    });
  });

  describe('PUT /sites/:id', () => {
    it('should update site', async () => {
      const updatedSite = createMockSite({ name: 'Updated Site' });
      (siteService.update as jest.Mock).mockResolvedValue(updatedSite);

      const response = await request(app)
        .put('/sites/site-123')
        .send({ name: 'Updated Site' });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /sites/:id', () => {
    it('should delete site', async () => {
      (siteService.delete as jest.Mock).mockResolvedValue({ message: 'Deleted' });

      const response = await request(app).delete('/sites/site-123');

      expect(response.status).toBe(204);
    });
  });
});