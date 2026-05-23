import { Router } from 'express';
import { prisma } from '../../lib/prisma';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { player1DiscordId, player2DiscordId, score, map } = req.body;

    const [score1, score2] = score.split(':').map(Number);

    // znajdź lub stwórz graczy
    const p1 = await prisma.player.upsert({
      where: { discordId: player1DiscordId },
      update: {},
      create: {
        discordId: player1DiscordId,
        nickname: 'Player1',
      },
    });

    const p2 = await prisma.player.upsert({
      where: { discordId: player2DiscordId },
      update: {},
      create: {
        discordId: player2DiscordId,
        nickname: 'Player2',
      },
    });

    const winnerId = score1 > score2 ? p1.id : p2.id;

    const match = await prisma.match.create({
      data: {
        player1Id: p1.id,
        player2Id: p2.id,
        score1,
        score2,
        map,
      },
    });

    // update statów
    await prisma.player.update({
      where: { id: p1.id },
      data: {
        ...(score1 > score2 ? { wins: { increment: 1 } } : {}),
        ...(score1 < score2 ? { losses: { increment: 1 } } : {}),
      },
    });

    await prisma.player.update({
      where: { id: p2.id },
      data: {
        ...(score2 > score1 ? { wins: { increment: 1 } } : {}),
        ...(score2 < score1 ? { losses: { increment: 1 } } : {}),
      },
    });

    res.json({ ok: true, match, winnerId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'match create failed' });
  }
});

export default router;
