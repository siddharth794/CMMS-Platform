import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize } from './models';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to sync database:', err);
});

export default app;
