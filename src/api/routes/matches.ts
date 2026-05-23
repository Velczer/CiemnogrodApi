import { Router } from 'express';
import { prisma } from '../../lib/prisma';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const {
      player1DiscordId,
      player2DiscordId,
      player1Name,
      player2Name,
      faction1,
      faction2,
      score1,
      score2,
      map,
    } = req.body;

    // znajdź lub stwórz graczy
    const p1 = await prisma.player.upsert({
      where: { discordId: player1DiscordId },
      update: {},
      create: {
        discordId: player1DiscordId,
        nickname: player1Name,
      },
    });

    const p2 = await prisma.player.upsert({
      where: { discordId: player2DiscordId },
      update: {},
      create: {
        discordId: player2DiscordId,
        nickname: player2Name,
      },
    });

    const winnerId = score1 > score2 ? p1.id : p2.id;

    const match = await prisma.match.create({
      data: {
        player1Id: p1.id,
        player2Id: p2.id,
        faction1,
        faction2,
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

router.get('/', async (req, res) => {
  try {
    const rawPlayerId = req.query.playerId;
    const limit = req.query.limit;

    const playerId = typeof rawPlayerId === 'string' ? rawPlayerId : undefined;

    const where = playerId
      ? {
          OR: [
            { player1: { discordId: playerId } },
            { player2: { discordId: playerId } },
          ],
        }
      : {};

    const matches = await prisma.match.findMany({
      where,
      orderBy: {
        id: 'desc',
      },
      take: limit ? Number(limit) : 50,
      include: {
        player1: true,
        player2: true,
      },
    });

    res.json(matches);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'failed to fetch matches' });
  }
});

export default router;
