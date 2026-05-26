export type TournamentPlayer = {
  id: string;
  name: string;
};

export type GeneratedMatch = {
  matchNumber: number;
  round: string;
  roundOrder: number;
  matchOrder: number;

  player1: TournamentPlayer | null;
  player2: TournamentPlayer | null;

  nextMatchNumber: number | null;
  nextSlot: 1 | 2 | null;

  loserNextMatchNumber: number | null;
  loserNextSlot: 1 | 2 | null;

  status: 'upcoming' | 'live' | 'completed';

  winner: TournamentPlayer | null;
};
