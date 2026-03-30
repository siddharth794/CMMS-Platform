import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authService } from '../../services/auth.service';
import { userRepository } from '../../repositories/user.repository';
import { UnauthorizedError, ForbiddenError, InternalError } from '../../errors/AppError';

jest.mock('bcryptjs');
jest.mock('../../repositories/user.repository');
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  fatal: jest.fn(),
  error: jest.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    is_active: true,
    org_id: 'org-123',
    Role: { id: 'role-1', name: 'admin' },
  };

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      (userRepository.findByEmailWithOrg as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.updateLastLogin as jest.Mock).mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({ email: 'test@example.com', password: 'password123' });

      expect(userRepository.findByEmailWithOrg).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(mockUser);
      expect(result.access_token).toBeDefined();
      expect(result.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedError if user not found', async () => {
      (userRepository.findByEmailWithOrg as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({ email: 'notfound@example.com', password: 'password123' })
      ).rejects.toThrow(UnauthorizedError);

      expect(userRepository.findByEmailWithOrg).toHaveBeenCalledWith('notfound@example.com');
    });

    it('should throw UnauthorizedError if password is incorrect', async () => {
      (userRepository.findByEmailWithOrg as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow(UnauthorizedError);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashed_password');
    });

    it('should throw ForbiddenError if user account is disabled', async () => {
      const disabledUser = { ...mockUser, is_active: false };
      (userRepository.findByEmailWithOrg as jest.Mock).mockResolvedValue(disabledUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        authService.login({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should generate JWT with correct payload', async () => {
      (userRepository.findByEmailWithOrg as jest.Mock).mockResolvedValue(mockUser);
      (userRepository.updateLastLogin as jest.Mock).mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({ email: 'test@example.com', password: 'password123' });

      const decoded = jwt.verify(result.access_token, process.env.JWT_SECRET_KEY || 'test-secret-key') as any;
      expect(decoded.sub).toBe('user-123');
      expect(decoded.org_id).toBe('org-123');
      expect(decoded.role).toBe('admin');
    });

    it('should handle user without role gracefully', async () => {
      const userWithoutRole = { ...mockUser, Role: null };
      (userRepository.findByEmailWithOrg as jest.Mock).mockResolvedValue(userWithoutRole);
      (userRepository.updateLastLogin as jest.Mock).mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({ email: 'test@example.com', password: 'password123' });

      const decoded = jwt.verify(result.access_token, process.env.JWT_SECRET_KEY || 'test-secret-key') as any;
      expect(decoded.role).toBeNull();
    });
  });

  describe('getJwtSecret', () => {
    it('should return JWT_SECRET_KEY when available', () => {
      process.env.JWT_SECRET_KEY = 'custom-secret';
      process.env.JWT_SECRET = undefined;
      
      const secret = (authService as any).getJwtSecret();
      expect(secret).toBe('custom-secret');
    });

    it('should return JWT_SECRET as fallback', () => {
      delete process.env.JWT_SECRET_KEY;
      process.env.JWT_SECRET = 'fallback-secret';
      
      const secret = (authService as any).getJwtSecret();
      expect(secret).toBe('fallback-secret');
    });

    it('should throw InternalError when no secret is configured', () => {
      delete process.env.JWT_SECRET_KEY;
      delete process.env.JWT_SECRET;
      
      expect(() => (authService as any).getJwtSecret()).toThrow(InternalError);
    });
  });
});