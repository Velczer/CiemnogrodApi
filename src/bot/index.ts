import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', () => {
  console.log(`Bot zalogowany jako ${client.user?.tag}`);
});

export function startBot() {
  client.login(process.env.DISCORD_TOKEN);
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'heroes') {
    const p1 = interaction.options.getUser('player1');
    const p2 = interaction.options.getUser('player2');
    const score = interaction.options.getString('score');
    const map = interaction.options.getString('map');

    if (!p1 || !p2 || !score) {
      await interaction.reply('Brak danych');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1DiscordId: p1.id,
          player2DiscordId: p2.id,
          score,
          map,
        }),
      });

      if (!res.ok) {
        throw new Error('API error');
      }

      await interaction.reply(
        `Zapisano wynik: ${p1.username} vs ${p2.username} (${score}) | ${map}`
      );
    } catch (e) {
      await interaction.reply('Błąd zapisu meczu');
    }
  }
});
