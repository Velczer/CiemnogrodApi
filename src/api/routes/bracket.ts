import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const matches = await prisma.tournamentMatch.findMany({
      orderBy: [{ roundOrder: 'asc' }, { matchOrder: 'asc' }],
    });

    const grouped = matches.reduce<Record<string, typeof matches>>(
      (acc, match) => {
        const round = match.round;

        acc[round] = [...(acc[round] ?? []), match];

        return acc;
      },
      {}
    );

    const bracket = Object.entries(grouped).map(([name, matches]) => ({
      name,
      matches: matches.map((match) => ({
        id: match.matchNumber,
        player1: match.player1Name,
        player2: match.player2Name,
        score1: match.score1,
        score2: match.score2,
        winner: match.winnerName,
        status: match.status,
      })),
    }));

    res.json(bracket);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch bracket' });
  }
});

export default router;
