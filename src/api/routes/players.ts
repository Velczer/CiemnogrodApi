import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { getActiveSeason } from '../../services/seasonService.js';

const router = Router();

function getMainFaction(matches: any[], playerId: number) {
  const factionCount: Record<string, number> = {};

  matches.forEach((match) => {
    const faction =
      match.player1Id === playerId ? match.faction1 : match.faction2;

    factionCount[faction] = (factionCount[faction] ?? 0) + 1;
  });

  return (
    Object.entries(factionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Temple'
  );
}

router.get('/', async (_req, res) => {
  try {
    const season = await getActiveSeason();

    const players = await prisma.player.findMany({
      include: {
        matches1: {
          where: {
            seasonId: season.id,
          },
        },
        matches2: {
          where: {
            seasonId: season.id,
          },
        },
      },
    });

    const finalWins = await prisma.tournamentMatch.findMany({
      where: {
        round: 'Final',
        status: 'completed',
        tournament: {
          seasonId: season.id,
        },
      },
    });

    const result = players.map((player) => {
      const seasonMatches = [...player.matches1, ...player.matches2];
      const mainFaction = getMainFaction(seasonMatches, player.id);

      const wins = seasonMatches.filter((match) => {
        const isPlayer1 = match.player1Id === player.id;

        return isPlayer1
          ? match.score1 > match.score2
          : match.score2 > match.score1;
      }).length;

      const losses = seasonMatches.filter((match) => {
        const isPlayer1 = match.player1Id === player.id;

        return isPlayer1
          ? match.score1 < match.score2
          : match.score2 < match.score1;
      }).length;

      const tournamentWins = finalWins.filter(
        (match) => match.winnerId === player.discordId
      ).length;

      return {
        id: player.id,
        discordId: player.discordId,
        nickname: player.nickname,
        wins,
        losses,
        tournamentWins,
        mainFaction,
      };
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch players' });
  }
});

export default router;
