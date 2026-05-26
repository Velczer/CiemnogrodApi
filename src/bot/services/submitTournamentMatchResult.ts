import { prisma } from '../../lib/prisma.js';

type TournamentPlayer = {
  id: string;
  name: string | null;
};

function parseScore(score: string) {
  const [score1, score2] = score.split(':').map(Number);

  if (
    score1 === undefined ||
    score2 === undefined ||
    Number.isNaN(score1) ||
    Number.isNaN(score2) ||
    score1 === score2
  ) {
    throw new Error('Nieprawidłowy wynik');
  }

  return { score1, score2 };
}

function getWinnerAndLoser({
  score1,
  score2,
  player1,
  player2,
}: {
  score1: number;
  score2: number;
  player1: TournamentPlayer;
  player2: TournamentPlayer;
}) {
  return score1 > score2
    ? { winner: player1, loser: player2 }
    : { winner: player2, loser: player1 };
}

async function activateMatchIfReady(matchId: number) {
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
  });

  if (!match?.player1Id || !match.player2Id) return;

  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: { status: 'live' },
  });
}

async function movePlayerToMatchSlot({
  tournamentId,
  matchNumber,
  slot,
  player,
  errorMessage,
}: {
  tournamentId: number;
  matchNumber: number | null;
  slot: number | null;
  player: TournamentPlayer;
  errorMessage: string;
}) {
  if (!matchNumber || !slot) return;

  const targetMatch = await prisma.tournamentMatch.findFirst({
    where: {
      tournamentId,
      matchNumber,
    },
  });

  if (!targetMatch) {
    throw new Error(errorMessage);
  }

  await prisma.tournamentMatch.update({
    where: { id: targetMatch.id },
    data:
      slot === 1
        ? {
            player1Id: player.id,
            player1Name: player.name,
          }
        : {
            player2Id: player.id,
            player2Name: player.name,
          },
  });

  await activateMatchIfReady(targetMatch.id);
}

async function incrementTournamentWins(discordId: string) {
  const player = await prisma.player.findUnique({
    where: { discordId },
  });

  if (!player) return;

  await prisma.player.update({
    where: { id: player.id },
    data: {
      tournamentWins: {
        increment: 1,
      },
    },
  });
}

export async function submitTournamentMatchResult(
  matchNumber: number,
  score: string
) {
  const tournament = await prisma.tournament.findFirst({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
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

  const { score1, score2 } = parseScore(score);

  const { winner, loser } = getWinnerAndLoser({
    score1,
    score2,
    player1: {
      id: match.player1Id,
      name: match.player1Name,
    },
    player2: {
      id: match.player2Id,
      name: match.player2Name,
    },
  });

  await prisma.tournamentMatch.update({
    where: { id: match.id },
    data: {
      score1,
      score2,
      winnerId: winner.id,
      winnerName: winner.name,
      status: 'completed',
    },
  });

  await movePlayerToMatchSlot({
    tournamentId: tournament.id,
    matchNumber: match.nextMatchNumber,
    slot: match.nextSlot,
    player: winner,
    errorMessage: 'Nie znaleziono następnego meczu',
  });

  await movePlayerToMatchSlot({
    tournamentId: tournament.id,
    matchNumber: match.loserNextMatchNumber,
    slot: match.loserNextSlot,
    player: loser,
    errorMessage: 'Nie znaleziono meczu o 3 miejsce',
  });

  if (match.round === 'Final' && !match.nextMatchNumber) {
    await incrementTournamentWins(winner.id);

    await prisma.tournament.update({
      where: { id: tournament.id },
      data: { status: 'completed' },
    });

    return {
      winner,
      loser,
      tournamentCompleted: true,
      nextMatchNumber: null,
      round: match.round,
    };
  }

  return {
    winner,
    tournamentCompleted: false,
    nextMatchNumber: match.nextMatchNumber,
    round: match.round,
  };
}
