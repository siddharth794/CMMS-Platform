import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { LoginSchema } from '../validators/auth.validator';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.post('/login', validate(LoginSchema), authController.login);
router.get('/me', authenticate, authController.me);

export default router;
