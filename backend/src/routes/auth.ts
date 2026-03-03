import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role, Organization } from '../models';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user: any = await User.findOne({
            where: { email },
            include: [{ model: Role }, { model: Organization }]
        });

        if (!user || !bcrypt.compareSync(password, user.password_hash)) {
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
        const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'supersecretkey';

        const token = jwt.sign(
            { sub: user.id, org_id: user.org_id, role: roleName },
            secret,
            { expiresIn: '24h' }
        );

        res.json({ access_token: token, user });
    } catch (err) {
        next(err);
    }
});

router.get('/me', authenticate, (req: any, res) => {
    res.json(req.user);
});

export default router;
