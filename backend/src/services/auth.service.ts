import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { LoginDTO, LoginResponse } from '../types/dto';
import { UnauthorizedError, ForbiddenError, InternalError } from '../errors/AppError';
import logger from '../config/logger';

class AuthService {
    private getJwtSecret(): string {
        const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
        if (!secret) {
            logger.fatal('JWT_SECRET environment variable is required');
            throw new InternalError('Server configuration error');
        }
        return secret;
    }

    async login(dto: LoginDTO): Promise<LoginResponse> {
        const user = await userRepository.findByEmailWithOrg(dto.email);

        if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
            throw new UnauthorizedError('Invalid email or password');
        }

        if (!user.is_active) {
            throw new ForbiddenError('Account is disabled');
        }

        await userRepository.updateLastLogin(user);

        const roleName = user.Role ? user.Role.name : null;
        const token = jwt.sign(
            { sub: user.id, org_id: user.org_id, role: roleName },
            this.getJwtSecret(),
            { expiresIn: '24h' }
        );

        logger.info({ userId: user.id, email: dto.email }, 'User logged in');

        return { access_token: token, user };
    }
}

export const authService = new AuthService();
