import express from 'express';
import cors from 'cors';
import matchesRouter from './routes/matches';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/matches', matchesRouter);

export default app;
