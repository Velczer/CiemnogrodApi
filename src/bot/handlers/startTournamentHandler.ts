import { EmbedBuilder } from 'discord.js';
import { client } from '../client.js';
import { prisma } from '../../lib/prisma.js';
import { generateBracket } from '../services/tournamentService.js';
import { getActiveSeason } from '../../services/seasonService.js';

const COLORS = {
  gold: 0xc9a84c,
  red: 0xc0392b,
  purple: 0x7b4fa6,
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

function formatBracketMessage(bracket: ReturnType<typeof generateBracket>) {
  return bracket
    .map((match) => {
      const player1 = match.player1?.name ?? 'TBD';
      const player2 = match.player2?.name ?? 'TBD';

      return `**#${match.matchNumber} • ${getRoundLabel(
        match.round
      )}**\n${player1} vs ${player2}`;
    })
    .join('\n\n');
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'starttournament') return;

  await interaction.deferReply();

  try {
    const activeTournament = await prisma.tournament.findFirst({
      where: { status: 'active' },
    });

    if (activeTournament) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.red)
        .setTitle('⚠️ Aktywny turniej już istnieje')
        .setDescription(
          'Zakończ obecny turniej albo usuń go przed utworzeniem nowego.'
        )
        .setFooter({ text: 'Ciemnogród Arena' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const players = Array.from({ length: 8 }, (_, i) => {
      const user = interaction.options.getUser(`player${i + 1}`);

      return user
        ? {
            id: user.id,
            name: user.username,
          }
        : null;
    }).filter(
      (
        player
      ): player is {
        id: string;
        name: string;
      } => Boolean(player)
    );

    const uniquePlayerIds = new Set(players.map((player) => player.id));

    if (uniquePlayerIds.size !== players.length) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.red)
        .setTitle('❌ Nieprawidłowi gracze')
        .setDescription('Nie możesz dodać tego samego gracza więcej niż raz.')
        .setFooter({ text: 'Ciemnogród Arena' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const bracket = generateBracket(players);
    const season = await getActiveSeason();

    const tournament = await prisma.tournament.create({
      data: {
        name: `Tournament ${new Date().toLocaleDateString('pl-PL')}`,
        status: 'active',
        seasonId: season.id,
      },
    });

    await prisma.tournamentMatch.createMany({
      data: bracket.map((match) => ({
        tournamentId: tournament.id,
        matchNumber: match.matchNumber,

        round: match.round,
        roundOrder: match.roundOrder,
        matchOrder: match.matchOrder,

        player1Id: match.player1?.id ?? null,
        player1Name: match.player1?.name ?? null,

        player2Id: match.player2?.id ?? null,
        player2Name: match.player2?.name ?? null,

        winnerId: match.winner?.id ?? null,
        winnerName: match.winner?.name ?? null,

        status: match.status,

        nextMatchNumber: match.nextMatchNumber,
        nextSlot: match.nextSlot,

        loserNextMatchNumber: match.loserNextMatchNumber,
        loserNextSlot: match.loserNextSlot,
      })),
    });

    const bracketMessage = formatBracketMessage(bracket);

    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle('🏟️ Turniej utworzony')
      .setDescription(
        `Los został rzucony. Czempioni stają na arenie.\n\n${bracketMessage}`
      )
      .addFields(
        {
          name: 'Liczba graczy',
          value: `${players.length}`,
          inline: true,
        },
        {
          name: 'Liczba meczów',
          value: `${bracket.length}`,
          inline: true,
        },
        {
          name: 'Status',
          value: 'Aktywny',
          inline: true,
        }
      )
      .setFooter({ text: 'Ciemnogród Arena • Kronikarz Turniejowy' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error(err);

    const embed = new EmbedBuilder()
      .setColor(COLORS.red)
      .setTitle('❌ Nie udało się utworzyć turnieju')
      .setDescription(
        err instanceof Error ? err.message : 'Wystąpił nieznany błąd.'
      )
      .setFooter({ text: 'Ciemnogród Arena' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
});
