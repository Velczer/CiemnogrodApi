import dotenv from 'dotenv';
import { client } from './client';
import './interactions/buttons';
import './commands/heroesHandler';

dotenv.config();

export function startBot() {
  client.login(process.env.DISCORD_TOKEN);
}
