import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const players = await prisma.player.findMany({
    orderBy: { wins: 'desc' },
    include: {
      matches1: true,
      matches2: true,
    },
  });

  const enriched = players.map((player) => {
    const matches = [...player.matches1, ...player.matches2];

    const factionCount: Record<string, number> = {};

    matches.forEach((match) => {
      const faction =
        match.player1Id === player.id ? match.faction1 : match.faction2;

      factionCount[faction] = (factionCount[faction] || 0) + 1;
    });

    const mainFaction =
      Object.entries(factionCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      ...player,
      mainFaction,
    };
  });

  res.json(enriched);
});

export default router;
