import dotenv from 'dotenv';
import { client } from './client.js';
import './interactions/buttons.js';
import './handlers/heroesHandler.js';
import './handlers/startTournamentHandler.js';

dotenv.config();

export function startBot() {
  client.login(process.env.DISCORD_TOKEN);

  client.once('ready', () => {
    console.log(`Bot zalogowany jako ${client.user?.tag}`);
  });
}
