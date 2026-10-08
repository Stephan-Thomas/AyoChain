export type Player = 'Player1' | 'Player2';

export type MatchStatus =
  | 'Pending'
  | 'Active'
  | 'Completed'
  | 'Cancelled';

export type MatchOutcome =
  | 'None'
  | 'Player1Won'
  | 'Player2Won'
  | 'Draw';

export interface BoardState {
  pits: number[]; // 12 pits: 0-5 South (Player1), 6-11 North (Player2)
  p1_captured: number;
  p2_captured: number;
  current_turn: Player;
  is_game_over: boolean;
  winner: MatchOutcome;
}

export interface MatchInfo {
  id: string;
  creator: string;
  opponent?: string;
  wagerAmount: string; // e.g. "10 XLM"
  tokenAddress: string;
  createdAt: number;
  lastMoveTimestamp: number;
  status: MatchStatus;
  currentTurn: Player;
  board: BoardState;
  winner: MatchOutcome;
}

export interface MoveStep {
  fromPit: number;
  toPit: number;
  seedsInHand: number;
  capturedSeeds?: number;
}
