import type { MatchInfo, BoardState } from '../types/game';
import { getInitialBoard, executeMove } from '../engine/ayoRules';

export interface ContractConfig {
  contractId: string;
  rpcUrl: string;
  networkPassphrase: string;
}

export const DEFAULT_CONFIG: ContractConfig = {
  contractId: 'CBE64B74VAYOCHAINMATCHCONTRACTEXAMPLE77777777777777777777',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
};

const STORAGE_KEY = 'ayochain_matches_v1';

export class SorobanService {
  private config: ContractConfig;
  private matches: Map<string, MatchInfo> = new Map();

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadMatches();
  }

  public getConfig(): ContractConfig {
    return { ...this.config };
  }

  public setConfig(cfg: Partial<ContractConfig>) {
    this.config = { ...this.config, ...cfg };
  }

  private loadMatches() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const list: MatchInfo[] = JSON.parse(raw);
        list.forEach((m) => this.matches.set(m.id, m));
      } else {
        this.seedInitialMatches();
      }
    } catch {
      this.seedInitialMatches();
    }
  }

  private saveMatches() {
    try {
      const list = Array.from(this.matches.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  private seedInitialMatches() {
    const sample1: MatchInfo = {
      id: 'match-101',
      creator: 'GB7AYO7KINGS4GHANA444444444444444444444444444444444AYO',
      wagerAmount: '10 XLM',
      tokenAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      createdAt: Date.now() - 1000 * 60 * 15,
      lastMoveTimestamp: Date.now() - 1000 * 60 * 15,
      status: 'Pending',
      currentTurn: 'Player1',
      board: getInitialBoard(),
      winner: 'None',
    };

    const sample2: MatchInfo = {
      id: 'match-102',
      creator: 'GACHIEFTAIN8LAGOS88888888888888888888888888888888888AYO',
      wagerAmount: '25 XLM',
      tokenAddress: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      createdAt: Date.now() - 1000 * 60 * 45,
      lastMoveTimestamp: Date.now() - 1000 * 60 * 45,
      status: 'Pending',
      currentTurn: 'Player1',
      board: getInitialBoard(),
      winner: 'None',
    };

    this.matches.set(sample1.id, sample1);
    this.matches.set(sample2.id, sample2);
    this.saveMatches();
  }

  public getMatches(): MatchInfo[] {
    return Array.from(this.matches.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public getMatch(id: string): MatchInfo | undefined {
    return this.matches.get(id);
  }

  public createMatch(creator: string, wagerAmount: string): MatchInfo {
    const id = `match-${Date.now().toString(36)}`;
    const newMatch: MatchInfo = {
      id,
      creator,
      wagerAmount,
      tokenAddress: 'Native XLM',
      createdAt: Date.now(),
      lastMoveTimestamp: Date.now(),
      status: 'Pending',
      currentTurn: 'Player1',
      board: getInitialBoard(),
      winner: 'None',
    };

    this.matches.set(id, newMatch);
    this.saveMatches();
    return newMatch;
  }

  public joinMatch(matchId: string, opponent: string): MatchInfo {
    const match = this.matches.get(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'Pending') throw new Error('Match is not pending');

    match.opponent = opponent;
    match.status = 'Active';
    match.lastMoveTimestamp = Date.now();
    this.saveMatches();
    return match;
  }

  public cancelMatch(matchId: string, requester: string): MatchInfo {
    const match = this.matches.get(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'Pending') throw new Error('Cannot cancel active or completed match');
    if (match.creator !== requester) throw new Error('Only match creator can cancel');

    match.status = 'Cancelled';
    this.saveMatches();
    return match;
  }

  public playMove(matchId: string, pitIndex: number): { match: MatchInfo; board: BoardState } {
    const match = this.matches.get(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'Active') throw new Error('Match is not active');

    const result = executeMove(match.board, pitIndex);
    match.board = result.newBoard;
    match.currentTurn = result.newBoard.current_turn;
    match.lastMoveTimestamp = Date.now();

    if (result.newBoard.is_game_over) {
      match.status = 'Completed';
      match.winner = result.newBoard.winner;
    }

    this.saveMatches();
    return { match, board: match.board };
  }

  public resign(matchId: string, player: 'Player1' | 'Player2'): MatchInfo {
    const match = this.matches.get(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'Active') throw new Error('Match is not active');

    match.status = 'Completed';
    match.board.is_game_over = true;
    if (player === 'Player1') {
      match.winner = 'Player2Won';
      match.board.winner = 'Player2Won';
    } else {
      match.winner = 'Player1Won';
      match.board.winner = 'Player1Won';
    }
    this.saveMatches();
    return match;
  }

  public claimTimeout(matchId: string): MatchInfo {
    const match = this.matches.get(matchId);
    if (!match) throw new Error('Match not found');
    if (match.status !== 'Active') throw new Error('Match is not active');

    // Winner is the player whose turn it was NOT (i.e. the waiting player claims timeout on the stalling player)
    match.status = 'Completed';
    match.board.is_game_over = true;
    if (match.board.current_turn === 'Player1') {
      match.winner = 'Player2Won';
      match.board.winner = 'Player2Won';
    } else {
      match.winner = 'Player1Won';
      match.board.winner = 'Player1Won';
    }
    this.saveMatches();
    return match;
  }
}

export const soroban = new SorobanService();
