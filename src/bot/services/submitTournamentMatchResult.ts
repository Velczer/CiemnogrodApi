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

  // finał
  if (!match.nextMatchNumber || !match.nextSlot) {
    await prisma.tournament.update({
      where: {
        id: tournament.id,
      },
      data: {
        status: 'completed',
      },
    });

    return {
      winner,
      tournamentCompleted: true,
    };
  }

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

  return {
    winner,
    tournamentCompleted: false,
    nextMatchNumber: match.nextMatchNumber,
  };
}
