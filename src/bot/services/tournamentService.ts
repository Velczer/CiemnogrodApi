import type { GeneratedMatch, TournamentPlayer } from '../types/tournament.js';

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function nextPowerOfTwo(value: number) {
  return 2 ** Math.ceil(Math.log2(value));
}

function getRoundName(roundOrder: number, totalRounds: number) {
  if (roundOrder === totalRounds) return 'Final';
  if (roundOrder === totalRounds - 1) return 'Semifinals';
  if (roundOrder === totalRounds - 2) return 'Quarterfinals';

  return `Runda ${roundOrder}`;
}

export function generateBracket(players: TournamentPlayer[]) {
  if (players.length < 2) {
    throw new Error('Turniej wymaga minimum 2 graczy');
  }

  if (players.length > 8) {
    throw new Error('Turniej może mieć maksymalnie 8 graczy');
  }

  const shuffled = shuffle(players);
  const bracketSize = nextPowerOfTwo(shuffled.length);
  const totalRounds = Math.log2(bracketSize);

  const slots: Array<TournamentPlayer | null> = [
    ...shuffled,
    ...Array(bracketSize - shuffled.length).fill(null),
  ];

  const matches: GeneratedMatch[] = [];
  let matchNumber = 1;

  let previousRoundMatchNumbers: number[] = [];

  for (let i = 0; i < bracketSize; i += 2) {
    const player1 = slots[i] ?? null;
    const player2 = slots[i + 1] ?? null;

    const hasBye = !player1 || !player2;
    const winner = hasBye ? player1 ?? player2 : null;

    const match: GeneratedMatch = {
      matchNumber,
      round: getRoundName(1, totalRounds),
      roundOrder: 1,
      matchOrder: previousRoundMatchNumbers.length + 1,
      player1,
      player2,
      nextMatchNumber: null,
      nextSlot: null,
      status: hasBye ? 'completed' : 'live',
      winner,
    };

    matches.push(match);
    previousRoundMatchNumbers.push(matchNumber);
    matchNumber++;
  }

  for (let roundOrder = 2; roundOrder <= totalRounds; roundOrder++) {
    const currentRoundMatchNumbers: number[] = [];

    for (let i = 0; i < previousRoundMatchNumbers.length; i += 2) {
      const currentMatchNumber = matchNumber++;

      const match: GeneratedMatch = {
        matchNumber: currentMatchNumber,
        round: getRoundName(roundOrder, totalRounds),
        roundOrder,
        matchOrder: currentRoundMatchNumbers.length + 1,
        player1: null,
        player2: null,
        nextMatchNumber: null,
        nextSlot: null,
        status: 'upcoming',
        winner: null,
      };

      matches.push(match);
      currentRoundMatchNumbers.push(currentMatchNumber);

      const prev1 = matches.find(
        (item) => item.matchNumber === previousRoundMatchNumbers[i]
      );
      const prev2 = matches.find(
        (item) => item.matchNumber === previousRoundMatchNumbers[i + 1]
      );

      if (prev1) {
        prev1.nextMatchNumber = currentMatchNumber;
        prev1.nextSlot = 1;
      }

      if (prev2) {
        prev2.nextMatchNumber = currentMatchNumber;
        prev2.nextSlot = 2;
      }
    }

    previousRoundMatchNumbers = currentRoundMatchNumbers;
  }

  autoAdvanceByes(matches);

  return matches;
}

function autoAdvanceByes(matches: GeneratedMatch[]) {
  let changed = true;

  while (changed) {
    changed = false;

    for (const match of matches) {
      if (!match.winner || !match.nextMatchNumber || !match.nextSlot) continue;

      const nextMatch = matches.find(
        (item) => item.matchNumber === match.nextMatchNumber
      );

      if (!nextMatch) continue;

      if (match.nextSlot === 1 && !nextMatch.player1) {
        nextMatch.player1 = match.winner;
        changed = true;
      }

      if (match.nextSlot === 2 && !nextMatch.player2) {
        nextMatch.player2 = match.winner;
        changed = true;
      }

      if (
        nextMatch.player1 &&
        nextMatch.player2 &&
        nextMatch.status !== 'completed'
      ) {
        nextMatch.status = 'live';
      }

      const hasBye =
        (nextMatch.player1 && !nextMatch.player2) ||
        (!nextMatch.player1 && nextMatch.player2);

      if (hasBye && nextMatch.status !== 'completed') {
        nextMatch.winner = nextMatch.player1 ?? nextMatch.player2;
        nextMatch.status = 'completed';
      }
    }
  }
}
