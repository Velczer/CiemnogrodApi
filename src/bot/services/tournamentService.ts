import type { GeneratedMatch, TournamentPlayer } from '../types/tournament.js';

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function generateBracket(players: TournamentPlayer[]) {
  if (players.length < 2) {
    throw new Error('Turniej wymaga minimum 2 graczy');
  }

  if (players.length > 8) {
    throw new Error('Turniej może mieć maksymalnie 8 graczy');
  }

  const shuffled = shuffle(players);
  const matches: GeneratedMatch[] = [];

  let matchNumber = 1;

  if (shuffled.length === 2) {
    matches.push({
      matchNumber: matchNumber++,
      round: 'Final',
      roundOrder: 1,
      matchOrder: 1,
      player1: shuffled[0] ?? null,
      player2: shuffled[1] ?? null,
      nextMatchNumber: null,
      nextSlot: null,
      loserNextMatchNumber: null,
      loserNextSlot: null,
      status: 'live',
      winner: null,
    });

    return matches;
  }

  const preliminaryMatchesCount = shuffled.length > 4 ? shuffled.length - 4 : 0;

  const semifinalPlayers: Array<TournamentPlayer | null> = [];
  const preliminaryMatchNumbers: number[] = [];

  for (let i = 0; i < preliminaryMatchesCount; i++) {
    const player1 = shuffled[i * 2] ?? null;
    const player2 = shuffled[i * 2 + 1] ?? null;

    matches.push({
      matchNumber,
      round: 'Quarterfinals',
      roundOrder: 1,
      matchOrder: i + 1,
      player1,
      player2,
      nextMatchNumber: null,
      nextSlot: null,
      loserNextMatchNumber: null,
      loserNextSlot: null,
      status: 'live',
      winner: null,
    });

    preliminaryMatchNumbers.push(matchNumber);
    semifinalPlayers.push(null);
    matchNumber++;
  }

  const remainingPlayers = shuffled.slice(preliminaryMatchesCount * 2);

  semifinalPlayers.push(...remainingPlayers);

  while (semifinalPlayers.length < 4) {
    semifinalPlayers.push(null);
  }

  const semifinalRoundOrder = preliminaryMatchesCount > 0 ? 2 : 1;
  const finalRoundOrder = semifinalRoundOrder + 1;

  const semifinal1Number = matchNumber++;
  const semifinal2Number = matchNumber++;
  const thirdPlaceNumber = matchNumber++;
  const finalNumber = matchNumber++;

  matches.push({
    matchNumber: semifinal1Number,
    round: 'Semifinals',
    roundOrder: semifinalRoundOrder,
    matchOrder: 1,
    player1:
      preliminaryMatchNumbers[0] !== undefined
        ? null
        : semifinalPlayers[0] ?? null,
    player2:
      semifinalPlayers[
        preliminaryMatchesCount > 0 ? preliminaryMatchesCount : 1
      ] ?? null,
    nextMatchNumber: finalNumber,
    nextSlot: 1,
    loserNextMatchNumber: thirdPlaceNumber,
    loserNextSlot: 1,
    status: 'upcoming',
    winner: null,
  });

  matches.push({
    matchNumber: semifinal2Number,
    round: 'Semifinals',
    roundOrder: semifinalRoundOrder,
    matchOrder: 2,
    player1:
      preliminaryMatchNumbers[1] !== undefined
        ? null
        : semifinalPlayers[2] ?? null,
    player2:
      semifinalPlayers[
        preliminaryMatchesCount > 0 ? preliminaryMatchesCount + 1 : 3
      ] ?? null,
    nextMatchNumber: finalNumber,
    nextSlot: 2,
    loserNextMatchNumber: thirdPlaceNumber,
    loserNextSlot: 2,
    status: 'upcoming',
    winner: null,
  });

  matches.push({
    matchNumber: thirdPlaceNumber,
    round: 'ThirdPlace',
    roundOrder: finalRoundOrder,
    matchOrder: 2,
    player1: null,
    player2: null,
    nextMatchNumber: null,
    nextSlot: null,
    loserNextMatchNumber: null,
    loserNextSlot: null,
    status: 'upcoming',
    winner: null,
  });

  matches.push({
    matchNumber: finalNumber,
    round: 'Final',
    roundOrder: finalRoundOrder,
    matchOrder: 1,
    player1: null,
    player2: null,
    nextMatchNumber: null,
    nextSlot: null,
    loserNextMatchNumber: null,
    loserNextSlot: null,
    status: 'upcoming',
    winner: null,
  });

  preliminaryMatchNumbers.forEach((preliminaryMatchNumber, index) => {
    const match = matches.find(
      (item) => item.matchNumber === preliminaryMatchNumber
    );
    if (!match) return;

    match.nextMatchNumber = index === 0 ? semifinal1Number : semifinal2Number;
    match.nextSlot = 1;
  });

  for (const match of matches) {
    const hasBothPlayers = match.player1 && match.player2;

    if (hasBothPlayers && match.status !== 'completed') {
      match.status = 'live';
    }
  }

  return matches;
}
