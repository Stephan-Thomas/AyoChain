import { describe, it, expect } from 'vitest';
import {
  getInitialBoard,
  getLegalMoves,
  executeMove,
  doesMoveFeed,
  canFeedOpponent,
} from './ayoRules';
import { BoardState } from '../types/game';

describe('AyoRules (Abapa)', () => {
  it('initializes standard 48-seed board', () => {
    const board = getInitialBoard();
    expect(board.pits).toEqual(Array(12).fill(4));
    expect(board.p1_captured).toBe(0);
    expect(board.p2_captured).toBe(0);
    expect(board.current_turn).toBe('Player1');
    expect(board.is_game_over).toBe(false);
    expect(board.winner).toBe('None');

    const legal = getLegalMoves(board);
    expect(legal).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('sows counter-clockwise correctly from South pit', () => {
    const board = getInitialBoard();
    // Move pit 0 (contains 4 seeds: goes to 1, 2, 3, 4)
    const result = executeMove(board, 0);
    expect(result.newBoard.pits[0]).toBe(0);
    expect(result.newBoard.pits[1]).toBe(5);
    expect(result.newBoard.pits[2]).toBe(5);
    expect(result.newBoard.pits[3]).toBe(5);
    expect(result.newBoard.pits[4]).toBe(5);
    expect(result.newBoard.pits[5]).toBe(4);
    expect(result.newBoard.current_turn).toBe('Player2');
    expect(result.capturedCount).toBe(0);
  });

  it('skips origin pit when sowing 12 or more seeds (Kroo)', () => {
    const board: BoardState = {
      pits: [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      p1_captured: 0,
      p2_captured: 0,
      current_turn: 'Player1',
      is_game_over: false,
      winner: 'None',
    };

    const res = executeMove(board, 0);
    // Origin pit 0 must remain 0 seeds, 1 seed in each of the other 11 pits, and 12th seed in pit 1
    expect(res.newBoard.pits[0]).toBe(0);
    expect(res.newBoard.pits[1]).toBe(2); // visited twice (at start and after wrap)
    for (let i = 2; i <= 11; i++) {
      expect(res.newBoard.pits[i]).toBe(1);
    }
  });

  it('captures 2 or 3 seeds on opponent territory', () => {
    // Setup: P1 plays pit 4 with 2 seeds, lands on pit 6 (North) which had 1 seed -> total 2 seeds (captured!)
    const board: BoardState = {
      pits: [0, 0, 0, 0, 2, 0, 1, 4, 4, 4, 4, 4],
      p1_captured: 0,
      p2_captured: 0,
      current_turn: 'Player1',
      is_game_over: false,
      winner: 'None',
    };

    const res = executeMove(board, 4);
    expect(res.newBoard.pits[4]).toBe(0);
    expect(res.newBoard.pits[5]).toBe(1);
    // Pit 6 had 1 seed, received 1 seed = 2 seeds, opponent territory -> captured!
    expect(res.newBoard.pits[6]).toBe(0);
    expect(res.newBoard.p1_captured).toBe(2);
    expect(res.capturedCount).toBe(2);
  });

  it('chains backward continuous captures on opponent territory', () => {
    // P1 plays pit 5 (2 seeds) -> lands on 6 and 7.
    // Pits 6 and 7 both end up with 2 seeds. Both should be captured!
    const board: BoardState = {
      pits: [0, 0, 0, 0, 0, 2, 1, 1, 4, 4, 4, 4],
      p1_captured: 0,
      p2_captured: 0,
      current_turn: 'Player1',
      is_game_over: false,
      winner: 'None',
    };

    const res = executeMove(board, 5);
    expect(res.newBoard.pits[5]).toBe(0);
    expect(res.newBoard.pits[6]).toBe(0);
    expect(res.newBoard.pits[7]).toBe(0);
    expect(res.newBoard.p1_captured).toBe(4); // 2 + 2 = 4 captured
    expect(res.capturedCount).toBe(4);
  });

  it('prevents Grand Slam (starvation capture voided)', () => {
    // Opponent has seeds ONLY in pit 6 (1 seed). P1 has seeds in pit 0, 1, and 5.
    // If P1 lands on pit 6 making it 2 seeds, capturing would leave P2 with 0 seeds.
    // Abapa rule: capture is voided, seeds remain on the board.
    const board: BoardState = {
      pits: [4, 4, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
      p1_captured: 16,
      p2_captured: 16,
      current_turn: 'Player1',
      is_game_over: false,
      winner: 'None',
    };

    const res = executeMove(board, 5);
    // Pit 6 has 2 seeds now, but cannot be captured because P2 would have 0 seeds!
    expect(res.newBoard.pits[6]).toBe(2);
    expect(res.newBoard.p1_captured).toBe(16);
    expect(res.capturedCount).toBe(0);
  });

  it('enforces feeding rule when opponent territory is empty', () => {
    // P2 has 0 seeds. P1 has pit 0 (1 seed -> lands in pit 1, does NOT feed)
    // and pit 5 (2 seeds -> lands in pit 6, feeds!)
    const board: BoardState = {
      pits: [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0],
      p1_captured: 10,
      p2_captured: 10,
      current_turn: 'Player1',
      is_game_over: false,
      winner: 'None',
    };

    expect(canFeedOpponent(board.pits, 'Player1')).toBe(true);
    expect(doesMoveFeed(board.pits, 'Player1', 0)).toBe(false);
    expect(doesMoveFeed(board.pits, 'Player1', 5)).toBe(true);

    const legal = getLegalMoves(board);
    // Must only contain feeding moves!
    expect(legal).toEqual([5]);
  });

  it('declares winner immediately when capturing 25 or more seeds', () => {
    const board: BoardState = {
      pits: [0, 0, 0, 0, 2, 0, 1, 4, 4, 4, 4, 4],
      p1_captured: 23,
      p2_captured: 10,
      current_turn: 'Player1',
      is_game_over: false,
      winner: 'None',
    };

    const res = executeMove(board, 4);
    // 23 + 2 = 25 captured
    expect(res.newBoard.p1_captured).toBe(25);
    expect(res.newBoard.is_game_over).toBe(true);
    expect(res.newBoard.winner).toBe('Player1Won');
  });
});
