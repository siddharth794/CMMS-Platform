import request from 'supertest';
import express from 'express';
import { userService } from '../../services/user.service';
import { createMockUser } from '../utils/testHelpers';

jest.mock('../../services/user.service');
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

app.get('/users', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await userService.getAll(user.org_id, req.query as any);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.get('/users/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await userService.getById(req.params.id, user.org_id);
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.post('/users', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await userService.create(user.org_id, req.body, mockAudit, 'admin');
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.put('/users/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    const result = await userService.update(req.params.id, user.org_id, req.body, mockAudit, 'admin');
    res.json(result);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

app.delete('/users/:id', async (req: any, res) => {
  try {
    const user = req.user!;
    await userService.delete(req.params.id, user, mockAudit);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ detail: err.message });
  }
});

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should return paginated users', async () => {
      const mockUsers = [createMockUser(), createMockUser({ id: 'user-456' })];
      (userService.getAll as jest.Mock).mockResolvedValue({
        rows: mockUsers,
        count: 2,
        currentPage: 1,
        totalPages: 1,
        limit: 10
      });

      const response = await request(app).get('/users');

      expect(response.status).toBe(200);
      expect(response.body.rows).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });

    it('should filter users by role', async () => {
      (userService.getAll as jest.Mock).mockResolvedValue({ rows: [], count: 0, currentPage: 1, totalPages: 0, limit: 10 });

      const response = await request(app).get('/users?role_id=1');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by id', async () => {
      const mockU = createMockUser();
      (userService.getById as jest.Mock).mockResolvedValue(mockU);

      const response = await request(app).get('/users/user-123');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('user-123');
    });

    it('should return 404 for non-existent user', async () => {
      (userService.getById as jest.Mock).mockRejectedValue({ statusCode: 404, message: 'Not found' });

      const response = await request(app).get('/users/non-existent');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const newUser = createMockUser({ id: 'new-user-123' });
      (userService.create as jest.Mock).mockResolvedValue(newUser);

      const response = await request(app)
        .post('/users')
        .send({ email: 'new@example.com', first_name: 'New', last_name: 'User', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('new-user-123');
    });
  });

  describe('PUT /users/:id', () => {
    it('should update user', async () => {
      const updatedUser = createMockUser({ first_name: 'Updated' });
      (userService.update as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/users/user-123')
        .send({ first_name: 'Updated' });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user', async () => {
      (userService.delete as jest.Mock).mockResolvedValue({ message: 'Deleted' });

      const response = await request(app).delete('/users/user-123');

      expect(response.status).toBe(204);
    });
  });
});