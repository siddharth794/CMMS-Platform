import jwt from 'jsonwebtoken';
import { authenticate, requireRole, requirePermission, AuthRequest } from '../../middleware/auth';
import { JWT_SECRET } from '../utils/testHelpers';

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  fatal: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
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

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    const { User } = require('../../models');

    it('should return 401 if no authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ detail: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if no token in header', async () => {
      mockRequest.headers = { authorization: 'Bearer ' };

      await authenticate(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ detail: 'Authentication required' });
    });

    it('should return 401 for invalid token', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      await authenticate(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ detail: 'Invalid or expired token' });
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign({ sub: 'user-123' }, JWT_SECRET, { expiresIn: '-1s' });
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` };

      await authenticate(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ detail: 'Invalid or expired token' });
    });

    it('should return 401 if user not found', async () => {
      const validToken = jwt.sign({ sub: 'user-not-found' }, JWT_SECRET);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };
      (User.findByPk as jest.Mock).mockResolvedValue(null);

      await authenticate(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ detail: 'User not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() and set req.user for valid token', async () => {
      const validToken = jwt.sign({ sub: 'user-123', org_id: 'org-123', role: 'admin' }, JWT_SECRET);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };
      
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        toJSON: () => ({
          id: 'user-123',
          email: 'test@example.com',
          Roles: [],
          Groups: [],
          Organization: { id: 'org-123', name: 'Test Org' },
          site: null,
          managed_site: null,
        }),
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe('user-123');
    });

    it('should extract user with correct payload from token', async () => {
      const payload = { sub: 'user-123', org_id: 'org-123', role: 'admin' };
      const validToken = jwt.sign(payload, JWT_SECRET);
      mockRequest.headers = { authorization: `Bearer ${validToken}` };

      const mockUser = {
        id: 'user-123',
        Role: { id: 'role-1', name: 'admin', Accesses: [] },
        Groups: [],
        Organization: { id: 'org-123' },
        toJSON: function() { return { id: this.id, Role: this.Role, Groups: [], Organization: this.Organization }; }
      };
      (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

      await authenticate(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user?.effectiveRoles).toBeDefined();
      expect(mockRequest.user?.effectiveAccesses).toBeDefined();
    });
  });

  describe('requireRole', () => {
    it('should return 403 if no user in request', () => {
      mockRequest.user = undefined;
      const middleware = requireRole(['admin']);

      middleware(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ detail: 'Insufficient permissions' });
    });

    it('should return 403 if user does not have required role', () => {
      mockRequest.user = {
        Role: { name: 'technician' },
        effectiveRoles: [{ name: 'technician' }],
      };
      const middleware = requireRole(['admin', 'manager']);

      middleware(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() if user has required role (via Role)', () => {
      mockRequest.user = {
        Role: { name: 'admin' },
      };
      const middleware = requireRole(['admin']);

      middleware(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() if user has required role (via effectiveRoles)', () => {
      mockRequest.user = {
        Role: null,
        effectiveRoles: [{ name: 'manager' }, { name: 'technician' }],
      };
      const middleware = requireRole(['manager']);

      middleware(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should be case-insensitive for role checking', () => {
      mockRequest.user = {
        Role: { name: 'ADMIN' },
      };
      const middleware = requireRole(['admin']);

      middleware(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('should return 403 if no user in request', () => {
      mockRequest.user = undefined;
      const middleware = requirePermission('work_orders:create');

      middleware(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should return 403 if user lacks permission', () => {
      mockRequest.user = {
        effectiveRoles: [{ name: 'technician' }],
        effectiveAccesses: [{ name: 'work_orders:view' }],
      };
      const middleware = requirePermission('work_orders:create');

      middleware(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should call next() if user has required permission', () => {
      mockRequest.user = {
        effectiveRoles: [{ name: 'technician' }],
        effectiveAccesses: [{ name: 'work_orders:create' }, { name: 'work_orders:view' }],
      };
      const middleware = requirePermission('work_orders:create');

      middleware(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow super_admin to bypass granular checks', () => {
      mockRequest.user = {
        effectiveRoles: [{ name: 'super_admin' }],
        effectiveAccesses: [],
      };
      const middleware = requirePermission('some:random:permission');

      middleware(mockRequest as AuthRequest, mockResponse as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});