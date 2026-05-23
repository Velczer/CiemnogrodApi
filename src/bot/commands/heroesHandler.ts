import { client } from '../client';
import crypto from 'crypto';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { pendingMatches, scheduleMatchExpiry } from '../services/matchService';
import { tryFinalizeMatch } from '../services/matchService';

const autoAccept = process.env.AUTO_ACCEPT_MATCHES === 'true';

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'heroes') return;

  const p1 = interaction.options.getUser('player1');
  const p2 = interaction.options.getUser('player2');
  const score = interaction.options.getString('score');
  const map = interaction.options.getString('map');
  const faction1 = interaction.options.getString('faction1');
  const faction2 = interaction.options.getString('faction2');

  if (!p1 || !p2 || !score || !map || !faction1 || !faction2) {
    await interaction.reply('Brak danych');
    return;
  }

  const id = crypto.randomUUID();

  // 1. zapis do pamięci (pending)
  pendingMatches.set(id, {
    id,
    p1Id: p1.id,
    p2Id: p2.id,
    p1Name: p1.username,
    p2Name: p2.username,
    score,
    map,
    faction1,
    faction2,
    p1Accepted: autoAccept,
    p2Accepted: autoAccept,
  });

  // 2. AUTO MODE → od razu kończymy
  if (autoAccept) {
    await interaction.reply(
      `DEV MODE: Match zapisany automatycznie ${p1.username} vs ${p2.username} | ${score} | ${map}`
    );

    await tryFinalizeMatch(id);
    return;
  }

  // 3. buttony (tylko normal mode)
  const rowP1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`accept_${id}_${p1.id}`)
      .setLabel('Akceptuję')
      .setStyle(ButtonStyle.Success)
  );

  const rowP2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`accept_${id}_${p2.id}`)
      .setLabel('Akceptuję')
      .setStyle(ButtonStyle.Success)
  );

  // 4. DM do graczy
  try {
    await p1.send({
      content: `Czy akceptujesz wynik ${score} na mapie ${map}?`,
      components: [rowP1],
    });

    await p2.send({
      content: `Czy akceptujesz wynik ${score} na mapie ${map}?`,
      components: [rowP2],
    });
  } catch (e) {
    console.log('Nie mogę wysłać DM');
  }

  // 5. timeout 5 min (tylko normal mode)
  scheduleMatchExpiry(id);

  await interaction.reply(
    `Match pending: ${p1.username} vs ${p2.username} | ${score} | ${map}`
  );
});
