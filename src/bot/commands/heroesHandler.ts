import { client } from '../client.js';
import crypto from 'crypto';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import {
  pendingMatches,
  scheduleMatchExpiry,
} from '../services/matchService.js';
import { tryFinalizeMatch } from '../services/matchService.js';

const autoAccept = process.env.AUTO_ACCEPT_MATCHES === 'true';

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'heroes') return;

  if (!interaction.inGuild()) {
    await interaction.reply({
      content: 'Ta komenda działa tylko na serwerze.',
      ephemeral: true,
    });
    return;
  }

  const guild = interaction.guild!;
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

  if (autoAccept) {
    await interaction.reply(
      `DEV MODE: Mecz zapisany automatycznie ${p1.username} vs ${p2.username} | ${score} | ${map}`
    );

    await tryFinalizeMatch(id);
    return;
  }

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

  let dmErrors: string[] = [];

  try {
    const member1 = await guild.members.fetch(p1.id);
    await member1.send({
      content: `Czy akceptujesz wynik ${score} na mapie ${map}?`,
      components: [rowP1],
    });
  } catch (e) {
    dmErrors.push(p1.username);
    console.log('Cannot send DM to player1:', e);
  }

  try {
    const member2 = await guild.members.fetch(p2.id);
    await member2.send({
      content: `Czy akceptujesz wynik ${score} na mapie ${map}?`,
      components: [rowP2],
    });
  } catch (e) {
    dmErrors.push(p2.username);
    console.log('Cannot send DM to player2:', e);
  }

  scheduleMatchExpiry(id);

  if (dmErrors.length > 0) {
    await interaction.reply(
      `Mecz nie został zapisany, nie udało się wysłać DM do: ${dmErrors.join(
        ', '
      )}`
    );
  } else {
    await interaction.reply(
      `Mecz czekający na akceptację: ${p1.username} vs ${p2.username} | ${score} | ${map}`
    );
  }
});
