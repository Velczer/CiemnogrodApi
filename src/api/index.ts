import express from 'express';
import cors from 'cors';
import matchesRouter from './routes/matches';
import players from './routes/players';
import { apiKeyMiddleware } from './middleware/apiKey';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/matches', apiKeyMiddleware, matchesRouter);
app.use('/api/players', apiKeyMiddleware, players);

export default app;
