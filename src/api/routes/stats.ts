import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const champions = await prisma.player.count();
    const games = await prisma.match.count();
    const factions = await prisma.match.groupBy({
      by: ['faction1'],
      _count: {
        faction1: true,
      },
      orderBy: {
        _count: {
          faction1: 'desc',
        },
      },
      take: 1,
    });

    const mostPlayedFaction = factions[0]?.faction1 ?? 'Brak';

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
        value: 'I',
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
