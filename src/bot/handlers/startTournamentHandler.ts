import { client } from '../client.js';
import { prisma } from '../../lib/prisma.js';
import { generateBracket } from '../services/tournamentService.js';

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName !== 'starttournament') return;

  const activeTournament = await prisma.tournament.findFirst({
    where: { status: 'active' },
  });

  if (activeTournament) {
    await interaction.editReply(
      'Istnieje już aktywny turniej. Zakończ go albo usuń przed utworzeniem nowego.'
    );
    return;
  }

  try {
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
      await interaction.reply(
        'Nie możesz dodać tego samego gracza więcej niż raz.'
      );

      return;
    }

    const bracket = generateBracket(players);

    const tournament = await prisma.tournament.create({
      data: {
        name: `Tournament ${new Date().toLocaleDateString('pl-PL')}`,
        status: 'active',
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

    const message = bracket
      .map((match) => {
        return `#${match.matchNumber} • ${match.round}\n${
          match.player1?.name ?? 'BYE'
        } vs ${match.player2?.name ?? 'BYE'}`;
      })
      .join('\n\n');

    await interaction.reply({
      content: `Turniej utworzony!\n\n${message}`,
    });
  } catch (err) {
    console.error(err);

    await interaction.reply({
      content: 'Nie udało się utworzyć turnieju.',
      ephemeral: true,
    });
  }
});
