import crypto from 'crypto';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { client } from '../client.js';
import {
  pendingMatches,
  scheduleMatchExpiry,
  tryFinalizeMatch,
} from '../services/matchService.js';
import { translateFaction } from '../helpers/factions.js';

const autoAccept = process.env.AUTO_ACCEPT_MATCHES === 'true';

const COLORS = {
  gold: 0xc9a84c,
  red: 0xc0392b,
  green: 0x27ae60,
};

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'heroes') return;

  const guild = interaction.guild;

  const p1 = interaction.options.getUser('player1');
  const p2 = interaction.options.getUser('player2');

  const score = interaction.options.getString('score');
  const map = interaction.options.getString('map');

  const faction1 = interaction.options.getString('faction1');
  const faction2 = interaction.options.getString('faction2');

  if (!p1 || !p2 || !score || !map || !faction1 || !faction2) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.red)
      .setTitle('❌ Brak danych')
      .setDescription('Uzupełnij wszystkie wymagane pola.')
      .setFooter({ text: 'Ciemnogród Arena' })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });

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
    await tryFinalizeMatch(id);

    const embed = new EmbedBuilder()
      .setColor(COLORS.green)
      .setTitle('⚔️ Mecz zapisany')
      .setDescription(`**${p1.username}** pokonuje **${p2.username}**.`)
      .addFields(
        {
          name: 'Wynik',
          value: score,
          inline: true,
        },
        {
          name: 'Mapa',
          value: map,
          inline: true,
        },
        {
          name: 'Frakcje',
          value: `${translateFaction(faction1)} vs ${translateFaction(
            faction2
          )}`,
          inline: false,
        }
      )
      .setFooter({
        text: 'Ciemnogród Arena • DEV MODE',
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });

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

  const dmErrors: string[] = [];

  try {
    const member1 = await guild?.members.fetch(p1.id);

    await member1?.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.gold)
          .setTitle('⚔️ Prośba o akceptację meczu')
          .setDescription(
            `Czy akceptujesz wynik meczu przeciwko **${p2.username}**?`
          )
          .addFields(
            {
              name: 'Wynik',
              value: score,
              inline: true,
            },
            {
              name: 'Mapa',
              value: map,
              inline: true,
            },
            {
              name: 'Frakcje',
              value: `${translateFaction(faction1)} vs ${translateFaction(
                faction2
              )}`,
              inline: false,
            }
          )
          .setFooter({
            text: 'Ciemnogród Arena',
          })
          .setTimestamp(),
      ],
      components: [rowP1],
    });
  } catch (e) {
    dmErrors.push(p1.username);
    console.log('Cannot send DM to player1:', e);
  }

  try {
    const member2 = await guild?.members.fetch(p2.id);

    await member2?.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.gold)
          .setTitle('⚔️ Prośba o akceptację meczu')
          .setDescription(
            `Czy akceptujesz wynik meczu przeciwko **${p1.username}**?`
          )
          .addFields(
            {
              name: 'Wynik',
              value: score,
              inline: true,
            },
            {
              name: 'Mapa',
              value: map,
              inline: true,
            },
            {
              name: 'Frakcje',
              value: `${translateFaction(faction1)} vs ${translateFaction(
                faction2
              )}`,
              inline: false,
            }
          )
          .setFooter({
            text: 'Ciemnogród Arena',
          })
          .setTimestamp(),
      ],
      components: [rowP2],
    });
  } catch (e) {
    dmErrors.push(p2.username);
    console.log('Cannot send DM to player2:', e);
  }

  scheduleMatchExpiry(id);

  if (dmErrors.length > 0) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.red)
      .setTitle('❌ Nie udało się wysłać wiadomości')
      .setDescription(`Nie udało się wysłać DM do:\n**${dmErrors.join(', ')}**`)
      .setFooter({ text: 'Ciemnogród Arena' })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });

    return;
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.gold)
    .setTitle('📜 Mecz oczekuje na akceptację')
    .setDescription(`**${p1.username}** vs **${p2.username}**`)
    .addFields(
      {
        name: 'Wynik',
        value: score,
        inline: true,
      },
      {
        name: 'Mapa',
        value: map,
        inline: true,
      },
      {
        name: 'Frakcje',
        value: `${translateFaction(faction1)} vs ${translateFaction(faction2)}`,
        inline: false,
      }
    )
    .setFooter({
      text: 'Ciemnogród Arena',
    })
    .setTimestamp();

  await interaction.reply({
    embeds: [embed],
  });
});
