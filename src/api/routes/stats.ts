import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { getActiveSeason } from '../../services/seasonService.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const season = await getActiveSeason();

    const seasonMatches = await prisma.match.findMany({
      where: {
        seasonId: season.id,
      },
      select: {
        faction1: true,
        faction2: true,
      },
    });

    const champions = await prisma.player.count();

    const games = seasonMatches.length;

    const factionCount = seasonMatches.reduce<Record<string, number>>(
      (acc, match) => {
        acc[match.faction1] = (acc[match.faction1] ?? 0) + 1;
        acc[match.faction2] = (acc[match.faction2] ?? 0) + 1;

        return acc;
      },
      {}
    );

    const mostPlayedFaction =
      Object.entries(factionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      'Brak';

    const stats = [
      {
        value: champions.toString(),
        label: 'Czempionów',
      },
      {
        value: games.toString(),
        label: 'Rozegranych gier',
      },
      {
        value: mostPlayedFaction,
        label: 'Najczęściej rozgrywany zamek',
      },
      {
        value: season.id,
        label: 'Sezon',
      },
    ];

    res.json(stats);
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: 'failed to fetch stats',
    });
  }
});

export default router;
