type PendingMatch = {
  id: string;
  p1Id: string;
  p2Id: string;
  p1Name: string;
  p2Name: string;
  score: string;
  map: string;
  faction1: string;
  faction2: string;
  p1Accepted: boolean;
  p2Accepted: boolean;
};

export const pendingMatches = new Map<string, PendingMatch>();

/**
 * CREATE MATCH
 */
export function createPendingMatch(match: PendingMatch) {
  pendingMatches.set(match.id, match);
}

/**
 * ACCEPT MATCH BY USER
 */
export function acceptMatch(matchId: string, userId: string) {
  const match = pendingMatches.get(matchId);
  if (!match) return undefined;

  const updated: PendingMatch = {
    ...match,
    p1Accepted: match.p1Id === userId ? true : match.p1Accepted,
    p2Accepted: match.p2Id === userId ? true : match.p2Accepted,
  };

  pendingMatches.set(matchId, updated);

  return updated;
}

/**
 * CHECK IF READY
 */
export function isMatchReady(match: PendingMatch) {
  return match.p1Accepted && match.p2Accepted;
}

/**
 * SEND MATCH TO API (FINAL SAVE)
 */
export async function sendToAPI(match: PendingMatch) {
  try {
    const [score1, score2] = match.score.split(':').map(Number);

    await fetch('http://localhost:3000/api/matches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY ?? '',
      },
      body: JSON.stringify({
        player1DiscordId: match.p1Id,
        player2DiscordId: match.p2Id,
        player1Name: match.p1Name,
        player2Name: match.p2Name,
        faction1: match.faction1,
        faction2: match.faction2,
        map: match.map,
        score1,
        score2,
      }),
    });

    console.log(`Match ${match.id} saved to API`);
  } catch (err) {
    console.error('Error sending match to API:', err);
  }
}

/**
 * TRY FINALIZE MATCH (if both accepted)
 */
export async function tryFinalizeMatch(matchId: string) {
  const match = pendingMatches.get(matchId);
  if (!match) return;

  if (!isMatchReady(match)) return;

  await sendToAPI(match);
  pendingMatches.delete(matchId);
}

/**
 * TIMEOUT SYSTEM (5 MIN)
 */
export function scheduleMatchExpiry(matchId: string) {
  setTimeout(async () => {
    const match = pendingMatches.get(matchId);
    if (!match) return;

    if (!isMatchReady(match)) {
      pendingMatches.delete(matchId);
      console.log(`Match ${matchId} expired (not confirmed)`);
      return;
    }

    await sendToAPI(match);
    pendingMatches.delete(matchId);
  }, 5 * 60 * 1000);
}
