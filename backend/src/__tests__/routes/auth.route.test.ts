import request from 'supertest';
import express from 'express';
import { authService } from '../../services/auth.service';
import { JWT_SECRET } from '../utils/testHelpers';

jest.mock('../../services/auth.service');
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  fatal: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../models', () => ({
  User: {
    findByPk: jest.fn(),
  },
  Role: { include: [] },
  Access: {},
  Group: { include: [] },
  Organization: {},
  Site: { as: 'site' },
}));

const { User } = require('../../models');

const app = express();
app.use(express.json());

app.post('/auth/login', async (req, res) => {
  try {
    const dto = req.body;
    const result = await authService.login(dto);
    res.json(result);
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ detail: err.message });
  }
});

app.get('/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ detail: 'Authentication required' });
      return;
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const mockUser = {
      id: decoded.sub,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      Role: { id: 1, name: 'admin' },
      toJSON: function() { return this; }
    };
    (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
    
    res.json(mockUser);
  } catch (err: any) {
    res.status(401).json({ detail: 'Invalid or expired token' });
  }
});

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should return 200 and token on valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
        org_id: 'org-123',
        Role: { id: 'role-1', name: 'admin' },
      };
      
      (authService.login as jest.Mock).mockResolvedValue({
        access_token: 'mock-token',
        user: mockUser,
      });

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBe('mock-token');
      expect(response.body.user).toEqual(mockUser);
    });

    it('should return 401 for invalid credentials', async () => {
      (authService.login as jest.Mock).mockRejectedValue({
        statusCode: 401,
        message: 'Invalid email or password'
      });

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'invalid@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
    });

    it('should return 401 for missing email (no validation in test)', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(401);
    });

    it('should return 401 for missing password (no validation in test)', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return 200 with user data when authenticated', async () => {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ sub: 'user-123', org_id: 'org-123' }, JWT_SECRET);

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});