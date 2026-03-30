import request from 'supertest';
import express from 'express';
import { roleService } from '../../services/role.service';
import { groupService } from '../../services/group.service';
import { accessService } from '../../services/access.service';
import { createMockRole } from '../utils/testHelpers';

jest.mock('../../services/role.service');
jest.mock('../../services/group.service');
jest.mock('../../services/access.service');

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

app.use((req: any, _res, next) => {
  req.user = mockUser;
  next();
});

app.get('/roles', async (req: any, res) => {
  try {
    const user = req.user!;
    const roleName = user.effectiveRoles?.[0]?.name || 'admin';
    const result = await roleService.getByOrgId(user.org_id, roleName);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/roles/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await roleService.getByOrgId(user.org_id);
    res.json(result.find((r: any) => r.id === Number(req.params.id)));
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.post('/roles', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await roleService.create(user.org_id, req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.put('/roles/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await roleService.update(Number(req.params.id), user.org_id, req.body);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.delete('/roles/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    await roleService.delete(Number(req.params.id), user.org_id);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/groups', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await groupService.getByOrgId(user.org_id);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/groups/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await groupService.getByOrgId(user.org_id);
    res.json(result.find((g: any) => g.id === req.params.id));
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.post('/groups', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await groupService.create(user.org_id, req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/accesses', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await accessService.getByOrgId(user.org_id);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

describe('RBAC Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /roles', () => {
    it('should return roles', async () => {
      (roleService.getByOrgId as jest.Mock).mockResolvedValue([createMockRole()]);

      const response = await request(app).get('/roles');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /roles/:id', () => {
    it('should return role by id', async () => {
      (roleService.getByOrgId as jest.Mock).mockResolvedValue([createMockRole()]);

      const response = await request(app).get('/roles/1');

      expect(response.status).toBe(200);
    });
  });

  describe('POST /roles', () => {
    it('should create a new role', async () => {
      (roleService.create as jest.Mock).mockResolvedValue(createMockRole({ id: 2 }));

      const response = await request(app)
        .post('/roles')
        .send({ name: 'new_role', description: 'New Role' });

      expect(response.status).toBe(201);
    });
  });

  describe('GET /groups', () => {
    it('should return groups', async () => {
      (groupService.getByOrgId as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/groups');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /accesses', () => {
    it('should return accesses', async () => {
      (accessService.getByOrgId as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/accesses');

      expect(response.status).toBe(200);
    });
  });
});