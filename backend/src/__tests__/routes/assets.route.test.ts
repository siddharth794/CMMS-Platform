import request from 'supertest';
import express from 'express';
import { assetService } from '../../services/asset.service';
import { createMockAsset } from '../utils/testHelpers';

jest.mock('../../services/asset.service');
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

app.get('/assets', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await assetService.getAll(user.org_id, req.query as any);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/assets/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await assetService.getById(req.params.id, user.org_id);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.post('/assets', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await assetService.create(req.body, user.org_id, mockAudit);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.put('/assets/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await assetService.update(req.params.id, req.body, user.org_id, mockAudit);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.delete('/assets/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    await assetService.delete(req.params.id, user.org_id, mockAudit);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

describe('Assets Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /assets', () => {
    it('should return paginated assets', async () => {
      const mockAssets = [createMockAsset(), createMockAsset({ id: 'asset-456' })];
      (assetService.getAll as jest.Mock).mockResolvedValue({
        rows: mockAssets,
        count: 2,
        currentPage: 1,
        totalPages: 1,
        limit: 10
      });

      const response = await request(app).get('/assets');

      expect(response.status).toBe(200);
      expect(response.body.rows).toHaveLength(2);
    });

    it('should filter assets by status', async () => {
      (assetService.getAll as jest.Mock).mockResolvedValue({ rows: [], count: 0, currentPage: 1, totalPages: 0, limit: 10 });

      const response = await request(app).get('/assets?status=active');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /assets/:id', () => {
    it('should return asset by id', async () => {
      const mockAsset = createMockAsset();
      (assetService.getById as jest.Mock).mockResolvedValue(mockAsset);

      const response = await request(app).get('/assets/asset-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('asset-123');
    });

    it('should return 404 for non-existent asset', async () => {
      (assetService.getById as jest.Mock).mockRejectedValue({ statusCode: 404, message: 'Not found' });

      const response = await request(app).get('/assets/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /assets', () => {
    it('should create a new asset', async () => {
      const newAsset = createMockAsset({ id: 'new-asset-123' });
      (assetService.create as jest.Mock).mockResolvedValue(newAsset);

      const response = await request(app)
        .post('/assets')
        .send({ name: 'New Asset', asset_tag: 'AST-999', site_id: 'site-123' });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('new-asset-123');
    });
  });

  describe('PUT /assets/:id', () => {
    it('should update asset', async () => {
      const updatedAsset = createMockAsset({ name: 'Updated Asset' });
      (assetService.update as jest.Mock).mockResolvedValue(updatedAsset);

      const response = await request(app)
        .put('/assets/asset-123')
        .send({ name: 'Updated Asset' });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /assets/:id', () => {
    it('should delete asset', async () => {
      (assetService.delete as jest.Mock).mockResolvedValue({ message: 'Deleted' });

      const response = await request(app).delete('/assets/asset-123');

      expect(response.status).toBe(204);
    });
  });
});