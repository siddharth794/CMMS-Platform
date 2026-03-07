import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role, Organization } from '../models';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { LoginSchema } from '../validators/auth.validator';
import logger from '../config/logger';

const router = Router();

router.post('/login', validate(LoginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user: any = await User.findOne({
            where: { email },
            include: [{ model: Role }, { model: Organization }]
        });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            res.status(401).json({ detail: 'Invalid email or password' });
            return;
        }

        if (!user.is_active) {
            res.status(403).json({ detail: 'Account is disabled' });
            return;
        }

        user.last_login = new Date();
        await user.save();

        const roleName = user.Role ? user.Role.name : null;
        const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
        if (!secret) {
            logger.fatal('JWT_SECRET is not configured');
            res.status(500).json({ detail: 'Server configuration error' });
            return;
        }

        const token = jwt.sign(
            { sub: user.id, org_id: user.org_id, role: roleName },
            secret,
            { expiresIn: '24h' }
        );

        logger.info({ userId: user.id, email }, 'User logged in');
        res.json({ access_token: token, user });
    } catch (err) {
        next(err);
    }
});

router.get('/me', authenticate, (req: any, res) => {
    res.json(req.user);
});

export default router;
