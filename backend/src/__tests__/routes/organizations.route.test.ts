import request from 'supertest';
import express from 'express';
import { organizationService } from '../../services/organization.service';
import { createMockOrganization } from '../utils/testHelpers';

jest.mock('../../services/organization.service');
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

app.get('/organizations', async (req: any, res) => {
  try {
    const user = req.user!;
    const roleName = user.effectiveRoles?.[0]?.name || 'admin';
    const result = await organizationService.getAll(
      Number(req.query.skip) || 0,
      Number(req.query.limit) || 10,
      roleName,
      req.query as any
    );
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/organizations/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const roleName = user.effectiveRoles?.[0]?.name || 'admin';
    const result = await organizationService.getById(req.params.id, user.org_id, roleName);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.post('/organizations', async (req: any, res) => {
  try {
    const result = await organizationService.create(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.put('/organizations/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const roleName = user.effectiveRoles?.[0]?.name || 'admin';
    const result = await organizationService.update(req.params.id, req.body, user.org_id, roleName);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.delete('/organizations/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const roleName = user.effectiveRoles?.[0]?.name || 'admin';
    await organizationService.delete(req.params.id, false, roleName);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

describe('Organizations Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /organizations', () => {
    it('should return paginated organizations', async () => {
      const mockOrgs = [createMockOrganization(), createMockOrganization({ id: 'org-456' })];
      (organizationService.getAll as jest.Mock).mockResolvedValue({
        rows: mockOrgs,
        count: 2,
        currentPage: 1,
        totalPages: 1,
        limit: 10
      });

      const response = await request(app).get('/organizations');

      expect(response.status).toBe(200);
      expect(response.body.rows).toHaveLength(2);
    });
  });

  describe('GET /organizations/:id', () => {
    it('should return organization by id', async () => {
      const mockOrg = createMockOrganization();
      (organizationService.getById as jest.Mock).mockResolvedValue(mockOrg);

      const response = await request(app).get('/organizations/org-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('org-123');
    });

    it('should return 404 for non-existent organization', async () => {
      (organizationService.getById as jest.Mock).mockRejectedValue({ statusCode: 404, message: 'Not found' });

      const response = await request(app).get('/organizations/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /organizations', () => {
    it('should create a new organization', async () => {
      const newOrg = createMockOrganization({ id: 'new-org-123' });
      (organizationService.create as jest.Mock).mockResolvedValue(newOrg);

      const response = await request(app)
        .post('/organizations')
        .send({ name: 'New Organization', slug: 'new-org' });

      expect(response.status).toBe(201);
    });
  });

  describe('PUT /organizations/:id', () => {
    it('should update organization', async () => {
      const updatedOrg = createMockOrganization({ name: 'Updated Org' });
      (organizationService.update as jest.Mock).mockResolvedValue(updatedOrg);

      const response = await request(app)
        .put('/organizations/org-123')
        .send({ name: 'Updated Org' });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /organizations/:id', () => {
    it('should delete organization', async () => {
      (organizationService.delete as jest.Mock).mockResolvedValue({ message: 'Deleted' });

      const response = await request(app).delete('/organizations/org-123');

      expect(response.status).toBe(204);
    });
  });
});