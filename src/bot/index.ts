import dotenv from 'dotenv';
import { client } from './client.js';
import './interactions/buttons.js';
import './commands/heroesHandler.js';

dotenv.config();

export function startBot() {
  client.login(process.env.DISCORD_TOKEN);
}
