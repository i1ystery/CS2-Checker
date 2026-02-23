import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import playersRouter from './routes/players';
import matchesRouter from './routes/matches';
import demosRouter from './routes/demos';
import databaseRouter from './routes/database';
import { connectDatabase } from './database/connection';

// Načtení environment proměnných
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));

// Testovací endpoint
app.get('/api/test', (_req, res) => {
  res.json({
    message: 'Backend server běží!',
    status: 'online'
  });
});

// Routes
app.use('/api/players', playersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/demos', demosRouter);
app.use('/api/database', databaseRouter);

// Error handler - vždy vracet JSON
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Interní chyba serveru' 
  });
});

// Start serveru
app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
  
  connectDatabase();
});
