import dotenv from 'dotenv';
import app from './api/index.js';
import { startBot } from './bot/index.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API działa na porcie ${PORT}`);
});

startBot();
