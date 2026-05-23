import dotenv from 'dotenv';
import app from './api/index.js';
import { startBot } from './bot/index.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API działa na porcie ${PORT}`);
});

startBot();
