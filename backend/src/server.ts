import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { sequelize, User } from './models';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.IO Setup
const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Store active user sockets: Map<userId, socketId>
export const activeSockets = new Map<string, string>();

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error: Token missing'));

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findByPk(decoded.id);
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
    console.log(`User connected to socket: ${userId} (${socket.id})`);

    // Let clients join specific rooms (e.g., viewing a specific work order)
    socket.on('join_wo_room', (woId: string) => {
        socket.join(`wo_${woId}`);
        console.log(`User ${userId} joined room wo_${woId}`);
    });

    socket.on('leave_wo_room', (woId: string) => {
        socket.leave(`wo_${woId}`);
    });

    socket.on('disconnect', () => {
        activeSockets.delete(userId);
        console.log(`User disconnected: ${userId}`);
    });
});

// Make io accessible in routes
app.set('io', io);

app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'CMMS APIs are running' });
});

import apiRoutes from './routes';

app.use('/api', apiRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("Error Message:", err.message);
    console.error(err.stack);
    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ detail: message });
});

const PORT = process.env.PORT || 8000;

sequelize.sync({ alter: true }).then(() => {
    console.log('Database synced successfully.');
    httpServer.listen(PORT, () => {
        console.log(`Server and Socket.IO are running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to sync database:', err);
});

export default app;
