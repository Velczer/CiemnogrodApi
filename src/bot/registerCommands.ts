import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { heroesCommand } from './commands/heroes';

dotenv.config();

const commands = [heroesCommand.toJSON()];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

async function registerCommands() {
  try {
    console.log('Rejestruję komendy...');

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: commands,
    });

    console.log('Komendy zarejestrowane!');
  } catch (error) {
    console.error(error);
  }
}

registerCommands();
