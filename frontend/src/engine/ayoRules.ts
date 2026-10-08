import { BoardState, Player, MatchOutcome } from '../types/game';

export const P1_RANGE = [0, 1, 2, 3, 4, 5];
export const P2_RANGE = [6, 7, 8, 9, 10, 11];

export function getInitialBoard(): BoardState {
  return {
    pits: Array(12).fill(4),
    p1_captured: 0,
    p2_captured: 0,
    current_turn: 'Player1',
    is_game_over: false,
    winner: 'None',
  };
}

export function isOpponentPit(player: Player, pitIndex: number): boolean {
  if (player === 'Player1') {
    return pitIndex >= 6 && pitIndex <= 11;
  } else {
    return pitIndex >= 0 && pitIndex <= 5;
  }
}

export function isPlayerPit(player: Player, pitIndex: number): boolean {
  if (player === 'Player1') {
    return pitIndex >= 0 && pitIndex <= 5;
  } else {
    return pitIndex >= 6 && pitIndex <= 11;
  }
}

export function opponentSideEmpty(pits: number[], player: Player): boolean {
  const range = player === 'Player1' ? P2_RANGE : P1_RANGE;
  return range.every((i) => pits[i] === 0);
}

export function canFeedOpponent(pits: number[], player: Player): boolean {
  const range = player === 'Player1' ? P1_RANGE : P2_RANGE;
  return range.some((pit) => pits[pit] > 0 && doesMoveFeed(pits, player, pit));
}

export function doesMoveFeed(pits: number[], player: Player, pit: number): boolean {
  const seeds = pits[pit];
  if (seeds === 0) return false;

  let curr = pit;
  let remaining = seeds;
  while (remaining > 0) {
    curr = (curr + 1) % 12;
    if (curr === pit) continue; // skip origin
    if (isOpponentPit(player, curr)) {
      return true;
    }
    remaining--;
  }
  return false;
}

export function getLegalMoves(board: BoardState): number[] {
  if (board.is_game_over) return [];

  const player = board.current_turn;
  const range = player === 'Player1' ? P1_RANGE : P2_RANGE;
  const pitsWithSeeds = range.filter((p) => board.pits[p] > 0);

  // If opponent has no seeds, player must feed if possible
  const oppEmpty = opponentSideEmpty(board.pits, player);
  if (oppEmpty) {
    const feedingMoves = pitsWithSeeds.filter((p) => doesMoveFeed(board.pits, player, p));
    if (feedingMoves.length > 0) {
      return feedingMoves;
    }
  }

  return pitsWithSeeds;
}

export interface MoveResult {
  newBoard: BoardState;
  sownPath: number[];
  capturedPits: number[];
  capturedCount: number;
}

export function executeMove(board: BoardState, pitIndex: number): MoveResult {
  const legalMoves = getLegalMoves(board);
  if (!legalMoves.includes(pitIndex)) {
    throw new Error(`Illegal move at pit ${pitIndex}`);
  }

  const player = board.current_turn;
  const pits = [...board.pits];
  let p1Captured = board.p1_captured;
  let p2Captured = board.p2_captured;

  let seedsToSow = pits[pitIndex];
  pits[pitIndex] = 0;

  const sownPath: number[] = [];
  let curr = pitIndex;

  while (seedsToSow > 0) {
    curr = (curr + 1) % 12;
    // Skip original pit in case of 12+ seeds (Kroo)
    if (curr === pitIndex) continue;
    pits[curr]++;
    sownPath.push(curr);
    seedsToSow--;
  }

  const endPit = curr;
  let capturedCount = 0;
  const capturedPits: number[] = [];

  // Capture evaluation
  if (isOpponentPit(player, endPit) && (pits[endPit] === 2 || pits[endPit] === 3)) {
    // Check backwards chain
    const potentialCaptures: number[] = [];
    let scanPit = endPit;

    while (
      isOpponentPit(player, scanPit) &&
      (pits[scanPit] === 2 || pits[scanPit] === 3)
    ) {
      potentialCaptures.push(scanPit);
      scanPit = (scanPit + 11) % 12;
    }

    // Grand slam check: would this leave opponent with 0 seeds?
    const testPits = [...pits];
    let potentialSeeds = 0;
    for (const p of potentialCaptures) {
      potentialSeeds += testPits[p];
      testPits[p] = 0;
    }

    const oppRange = player === 'Player1' ? P2_RANGE : P1_RANGE;
    const oppTotalAfter = oppRange.reduce((acc, p) => acc + testPits[p], 0);

    if (oppTotalAfter > 0) {
      // Legal capture!
      capturedCount = potentialSeeds;
      for (const p of potentialCaptures) {
        pits[p] = 0;
        capturedPits.push(p);
      }
      if (player === 'Player1') {
        p1Captured += capturedCount;
      } else {
        p2Captured += capturedCount;
      }
    }
    // If oppTotalAfter === 0, grand slam prevents capture; seeds remain.
  }

  // Check Game Over conditions
  let isGameOver = false;
  let winner: MatchOutcome = 'None';

  if (p1Captured >= 25) {
    isGameOver = true;
    winner = 'Player1Won';
  } else if (p2Captured >= 25) {
    isGameOver = true;
    winner = 'Player2Won';
  } else if (p1Captured === 24 && p2Captured === 24) {
    isGameOver = true;
    winner = 'Draw';
  } else {
    // Switch turn and check if next player has legal moves
    const nextPlayer: Player = player === 'Player1' ? 'Player2' : 'Player1';
    const nextRange = nextPlayer === 'Player1' ? P1_RANGE : P2_RANGE;
    const nextSeeds = nextRange.reduce((acc, p) => acc + pits[p], 0);

    if (nextSeeds === 0) {
      // Next player is starved and cannot move; game ends. Remaining seeds collected by player who has them.
      isGameOver = true;
      const currentRange = player === 'Player1' ? P1_RANGE : P2_RANGE;
      const remainingSeeds = currentRange.reduce((acc, p) => acc + pits[p], 0);
      for (const p of currentRange) {
        pits[p] = 0;
      }
      if (player === 'Player1') {
        p1Captured += remainingSeeds;
      } else {
        p2Captured += remainingSeeds;
      }

      if (p1Captured > p2Captured) winner = 'Player1Won';
      else if (p2Captured > p1Captured) winner = 'Player2Won';
      else winner = 'Draw';
    } else {
      // Check if total remaining seeds < 4 (stalemate)
      const totalRemaining = pits.reduce((acc, val) => acc + val, 0);
      if (totalRemaining < 4) {
        isGameOver = true;
        // Remaining seeds returned to their respective side owners
        for (const p of P1_RANGE) p1Captured += pits[p];
        for (const p of P2_RANGE) p2Captured += pits[p];
        pits.fill(0);

        if (p1Captured > p2Captured) winner = 'Player1Won';
        else if (p2Captured > p1Captured) winner = 'Player2Won';
        else winner = 'Draw';
      }
    }
  }

  const nextTurn: Player = player === 'Player1' ? 'Player2' : 'Player1';

  return {
    newBoard: {
      pits,
      p1_captured: p1Captured,
      p2_captured: p2Captured,
      current_turn: isGameOver ? board.current_turn : nextTurn,
      is_game_over: isGameOver,
      winner,
    },
    sownPath,
    capturedPits,
    capturedCount,
  };
}

/**
 * Basic heuristic AI for Ayo Practice Mode:
 * Evaluates legal moves prioritizing captures, then moves that don't give away captures.
 */
export function getBestAIMove(board: BoardState): number {
  const legalMoves = getLegalMoves(board);
  if (legalMoves.length === 0) return -1;
  if (legalMoves.length === 1) return legalMoves[0];

  let bestMove = legalMoves[0];
  let bestScore = -Infinity;

  for (const move of legalMoves) {
    try {
      const res = executeMove(board, move);
      let score = res.capturedCount * 10;

      // Bonus if moving keeps pits safe or distributes well
      if (board.pits[move] > 4) {
        score += 2;
      }

      // Penalize leaving 1 or 2 seeds on own side that can be captured
      const opp = res.newBoard.current_turn;
      const oppLegal = getLegalMoves(res.newBoard);
      let maxOppCapture = 0;
      for (const oppMove of oppLegal) {
        try {
          const oppRes = executeMove(res.newBoard, oppMove);
          if (oppRes.capturedCount > maxOppCapture) {
            maxOppCapture = oppRes.capturedCount;
          }
        } catch {
          // ignore
        }
      }
      score -= maxOppCapture * 8;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } catch {
      // ignore
    }
  }

  return bestMove;
}
