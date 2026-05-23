import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { heroesCommand } from './commands/heroes.js';

dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) throw new Error('Brak DISCORD_TOKEN');
if (!CLIENT_ID) throw new Error('Brak CLIENT_ID');

const token: string = TOKEN;
const clientId: string = CLIENT_ID;

const commands = [heroesCommand.toJSON()];

const rest = new REST({ version: '10' }).setToken(token);

async function registerCommands() {
  try {
    console.log('Rejestruję komendy...');

    // PROD: global (może trwać do 1h)
    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log('Komendy zarejestrowane (GLOBAL)!');
  } catch (error) {
    console.error('Błąd rejestracji komend:', error);
  }
}

registerCommands();
