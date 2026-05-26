import { EmbedBuilder } from 'discord.js';
import { client } from '../client.js';
import { submitTournamentMatchResult } from '../services/submitTournamentMatchResult.js';

const COLORS = {
  gold: 0xc9a84c,
  bronze: 0xcd7f32,
  red: 0xc0392b,
};

function getRoundLabel(round: string) {
  const labels: Record<string, string> = {
    Quarterfinals: 'Ćwierćfinały',
    Semifinals: 'Półfinały',
    ThirdPlace: 'Walka o trzecie miejsce',
    Final: 'Finał',
  };

  return labels[round] ?? round;
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'tournamentmatch') return;

  await interaction.deferReply();

  try {
    const matchNumber = interaction.options.getInteger('match');
    const score = interaction.options.getString('score');

    if (!matchNumber || !score) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.red)
        .setTitle('❌ Brak danych')
        .setDescription('Podaj numer meczu oraz wynik, np. `2:1`.')
        .setFooter({ text: 'Ciemnogród Arena' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const result = await submitTournamentMatchResult(matchNumber, score);

    if (result.tournamentCompleted) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.gold)
        .setTitle('🏆 Turniej zakończony')
        .setDescription(
          `**${result.winner.name}** zasiada na pradawnym tronie.`
        )
        .addFields(
          {
            name: 'Zwycięzca',
            value: result.winner.name ?? 'Nieznany',
            inline: true,
          },
          {
            name: 'Drugie miejsce',
            value: result.loser?.name ?? 'Nieznany',
            inline: true,
          },
          {
            name: 'Wynik finału',
            value: score,
            inline: true,
          }
        )
        .setFooter({ text: 'Ciemnogród Arena • Kronikarz Turniejowy' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    if (result.round === 'ThirdPlace') {
      const embed = new EmbedBuilder()
        .setColor(COLORS.bronze)
        .setTitle('🥉 Walka o trzecie miejsce zakończona')
        .setDescription(
          `**${result.winner.name}** zdobywa trzecie miejsce i zapisuje swoje imię w kronikach.`
        )
        .addFields(
          {
            name: 'Mecz',
            value: `#${matchNumber}`,
            inline: true,
          },
          {
            name: 'Wynik',
            value: score,
            inline: true,
          },
          {
            name: 'Runda',
            value: getRoundLabel(result.round),
            inline: true,
          }
        )
        .setFooter({ text: 'Ciemnogród Arena' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle('⚔️ Wynik meczu zapisany')
      .setDescription(`**${result.winner.name}** zwycięża i awansuje dalej.`)
      .addFields(
        {
          name: 'Mecz',
          value: `#${matchNumber}`,
          inline: true,
        },
        {
          name: 'Wynik',
          value: score,
          inline: true,
        },
        {
          name: 'Runda',
          value: getRoundLabel(result.round),
          inline: true,
        },
        {
          name: 'Następny mecz',
          value: result.nextMatchNumber ? `#${result.nextMatchNumber}` : 'Brak',
          inline: true,
        }
      )
      .setFooter({ text: 'Ciemnogród Arena' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error(err);

    const embed = new EmbedBuilder()
      .setColor(COLORS.red)
      .setTitle('❌ Nie udało się zapisać wyniku')
      .setDescription(
        err instanceof Error ? err.message : 'Wystąpił nieznany błąd.'
      )
      .setFooter({ text: 'Ciemnogród Arena' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
});
