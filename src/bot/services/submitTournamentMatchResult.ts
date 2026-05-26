import { prisma } from '../../lib/prisma.js';

export async function submitTournamentMatchResult(
  matchNumber: number,
  score: string
) {
  const tournament = await prisma.tournament.findFirst({
    where: {
      status: 'active',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!tournament) {
    throw new Error('Brak aktywnego turnieju');
  }

  const match = await prisma.tournamentMatch.findFirst({
    where: {
      tournamentId: tournament.id,
      matchNumber,
    },
  });

  if (!match) {
    throw new Error('Nie znaleziono meczu');
  }

  if (!match.player1Id || !match.player2Id) {
    throw new Error('Mecz nie ma jeszcze dwóch graczy');
  }

  if (match.status === 'completed') {
    throw new Error('Mecz został już rozegrany');
  }

  const parsed = score.split(':').map(Number);

  const score1 = parsed[0];
  const score2 = parsed[1];

  if (
    score1 === undefined ||
    score2 === undefined ||
    Number.isNaN(score1) ||
    Number.isNaN(score2) ||
    score1 === score2
  ) {
    throw new Error('Nieprawidłowy wynik');
  }

  const winner =
    score1 > score2
      ? {
          id: match.player1Id,
          name: match.player1Name,
        }
      : {
          id: match.player2Id,
          name: match.player2Name,
        };

  const loser =
    score1 > score2
      ? {
          id: match.player2Id,
          name: match.player2Name,
        }
      : {
          id: match.player1Id,
          name: match.player1Name,
        };

  await prisma.tournamentMatch.update({
    where: {
      id: match.id,
    },
    data: {
      score1,
      score2,
      winnerId: winner.id,
      winnerName: winner.name,
      status: 'completed',
    },
  });

  // WRZUĆ ZWYCIĘZCĘ DO NASTĘPNEGO MECZU
  if (match.nextMatchNumber && match.nextSlot) {
    const nextMatch = await prisma.tournamentMatch.findFirst({
      where: {
        tournamentId: tournament.id,
        matchNumber: match.nextMatchNumber,
      },
    });

    if (!nextMatch) {
      throw new Error('Nie znaleziono następnego meczu');
    }

    await prisma.tournamentMatch.update({
      where: {
        id: nextMatch.id,
      },
      data:
        match.nextSlot === 1
          ? {
              player1Id: winner.id,
              player1Name: winner.name,
            }
          : {
              player2Id: winner.id,
              player2Name: winner.name,
            },
    });

    const updatedNextMatch = await prisma.tournamentMatch.findFirst({
      where: {
        id: nextMatch.id,
      },
    });

    if (updatedNextMatch?.player1Id && updatedNextMatch?.player2Id) {
      await prisma.tournamentMatch.update({
        where: {
          id: nextMatch.id,
        },
        data: {
          status: 'live',
        },
      });
    }
  }

  // WRZUĆ PRZEGRANEGO DO WALKI O 3 MIEJSCE
  if (match.loserNextMatchNumber && match.loserNextSlot) {
    const loserNextMatch = await prisma.tournamentMatch.findFirst({
      where: {
        tournamentId: tournament.id,
        matchNumber: match.loserNextMatchNumber,
      },
    });

    if (!loserNextMatch) {
      throw new Error('Nie znaleziono meczu o 3 miejsce');
    }

    await prisma.tournamentMatch.update({
      where: {
        id: loserNextMatch.id,
      },
      data:
        match.loserNextSlot === 1
          ? {
              player1Id: loser.id,
              player1Name: loser.name,
            }
          : {
              player2Id: loser.id,
              player2Name: loser.name,
            },
    });

    const updatedLoserMatch = await prisma.tournamentMatch.findFirst({
      where: {
        id: loserNextMatch.id,
      },
    });

    if (updatedLoserMatch?.player1Id && updatedLoserMatch?.player2Id) {
      await prisma.tournamentMatch.update({
        where: {
          id: loserNextMatch.id,
        },
        data: {
          status: 'live',
        },
      });
    }
  }

  // KONIEC TURNIEJU
  if (match.round === 'Final' && !match.nextMatchNumber) {
    const thirdPlaceMatch = await prisma.tournamentMatch.findFirst({
      where: {
        tournamentId: tournament.id,
        round: 'ThirdPlace',
      },
    });

    if (!thirdPlaceMatch || thirdPlaceMatch.status === 'completed') {
      const winnerPlayer = await prisma.player.findUnique({
        where: {
          discordId: winner.id,
        },
      });

      if (winnerPlayer) {
        await prisma.player.update({
          where: {
            id: winnerPlayer.id,
          },
          data: {
            tournamentWins: {
              increment: 1,
            },
          },
        });
      }

      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { status: 'completed' },
      });

      return {
        winner,
        tournamentCompleted: true,
      };
    }

    return {
      winner,
      tournamentCompleted: false,
      nextMatchNumber: null,
    };
  }

  return {
    winner,
    tournamentCompleted: false,
    nextMatchNumber: match.nextMatchNumber,
  };
}
