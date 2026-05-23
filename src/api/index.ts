import express from 'express';
import cors from 'cors';
import matchesRouter from './routes/matches.js';
import players from './routes/players.js';
import { apiKeyMiddleware } from './middleware/apiKey.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/matches', apiKeyMiddleware, matchesRouter);
app.use('/api/players', apiKeyMiddleware, players);

export default app;
