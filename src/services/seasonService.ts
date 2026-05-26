import { prisma } from '../lib/prisma.js';

export async function getActiveSeason() {
  const season = await prisma.season.findFirst({
    where: { status: 'active' },
    orderBy: { startsAt: 'desc' },
  });

  if (!season) {
    throw new Error('Brak aktywnego sezonu');
  }

  return season;
}
