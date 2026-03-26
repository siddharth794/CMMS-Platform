import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import { sequelize, User } from './models';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import { requestLogger } from './middleware/requestLogger';
import logger from './config/logger';
import { swaggerSpec } from './config/swagger';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ─── Socket.IO Setup ──────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

export const activeSockets = new Map<string, string>();

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error: Token missing'));

        const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
        if (!secret) return next(new Error('Server configuration error'));

        const decoded: any = jwt.verify(token, secret);
        const user = await User.findByPk(decoded.sub || decoded.id);
        if (!user || (!(user as any).is_active)) return next(new Error('Authentication error: Invalid user'));

        socket.data.user = user;
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    activeSockets.set(userId, socket.id);

    // Join user-specific room for targeted notifications
    socket.join(`user_${userId}`);

    logger.info({ userId, socketId: socket.id }, 'User connected to socket');

    socket.on('join_wo_room', (woId: string) => {
        socket.join(`wo_${woId}`);
        logger.debug({ userId, woId }, 'User joined WO room');
    });

    socket.on('leave_wo_room', (woId: string) => {
        socket.leave(`wo_${woId}`);
    });

    socket.on('disconnect', () => {
        activeSockets.delete(userId);
        logger.info({ userId }, 'User disconnected from socket');
    });
});

app.set('io', io);

// ─── Global Middleware Stack ──────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(requestId());
app.use(requestLogger());

// ─── Rate Limiting ────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { detail: 'Too many login attempts. Try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);

// ─── Static Files ─────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Health Check (Enhanced) ──────────────────────────────────────
app.get('/health', async (req: Request, res: Response) => {
    const checks: Record<string, string> = {};

    try {
        await sequelize.authenticate();
        checks.database = 'ok';
    } catch {
        checks.database = 'error';
    }

    checks.uptime = `${Math.floor(process.uptime())}s`;
    checks.memory = `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`;

    const allOk = Object.values(checks).every(v => v !== 'error');
    res.status(allOk ? 200 : 503).json({ status: allOk ? 'ok' : 'degraded', checks });
});

// ─── API Routes ───────────────────────────────────────────────────
import apiRoutes from './routes';
import cron from 'node-cron';
import { PMGeneratorWorker } from './workers/pmGenerator.worker';

app.use('/api', apiRoutes);

// ─── Swagger Documentation ─────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CMMS Platform API Docs',
}));
app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
});

// ─── Background Workers ────────────────────────────────────────────
const pmWorker = new PMGeneratorWorker();
cron.schedule('0 * * * *', () => { // Runs every hour
    pmWorker.evaluateAllActivePMs();
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

// ─── Startup ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;

sequelize.authenticate()
    .then(() => {
        logger.info('Database connection established successfully.');
        httpServer.listen(Number(PORT), '0.0.0.0', () => {
            logger.info({ port: PORT }, 'Server and Socket.IO are running');
        });
    })
    .catch(err => {
        logger.fatal({ err }, 'Failed to start server');
        process.exit(1);
    });

// ─── Graceful Shutdown ────────────────────────────────────────────
const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal. Starting graceful shutdown...');

    httpServer.close(() => {
        logger.info('HTTP server closed');
    });

    io.close(() => {
        logger.info('Socket.IO closed');
    });

    try {
        await sequelize.close();
        logger.info('Database connections closed');
    } catch (err) {
        logger.error({ err }, 'Error closing database connections');
    }

    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
