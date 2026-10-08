export interface PlayerRankings {
  address: string;
  rating: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  earningsXlm: number;
  currentStreak: number;
  bestStreak: number;
}

export interface MatchHistoryItem {
  id: string;
  opponent: string;
  outcome: 'Won' | 'Lost' | 'Draw';
  wager: string;
  ratingDelta: number;
  date: number;
  p1Seeds: number;
  p2Seeds: number;
}

export type RankTier = 'Oware Initiate' | 'Village Challenger' | 'Royal Elder' | 'Ayo Grandmaster';

export function getRankTier(rating: number): { title: RankTier; symbol: string; color: string } {
  if (rating >= 1500) {
    return { title: 'Ayo Grandmaster', symbol: '👑', color: '#e5a93c' };
  } else if (rating >= 1300) {
    return { title: 'Royal Elder', symbol: '✦', color: '#f3c465' };
  } else if (rating >= 1100) {
    return { title: 'Village Challenger', symbol: '⚔', color: '#d96b43' };
  } else {
    return { title: 'Oware Initiate', symbol: '🌱', color: '#10b981' };
  }
}

const STORAGE_RANKINGS_KEY = 'ayochain_rankings_v1';
const STORAGE_HISTORY_KEY = 'ayochain_history_v1';

export class RankingsService {
  private players: Map<string, PlayerRankings> = new Map();
  private history: Map<string, MatchHistoryItem[]> = new Map();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (typeof localStorage === 'undefined') {
        this.seedInitialRankings();
        this.seedInitialHistory();
        return;
      }
      const raw = localStorage.getItem(STORAGE_RANKINGS_KEY);
      if (raw) {
        const list: PlayerRankings[] = JSON.parse(raw);
        list.forEach((p) => this.players.set(p.address.toLowerCase(), p));
      } else {
        this.seedInitialRankings();
      }

      const rawHist = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (rawHist) {
        const parsed: Record<string, MatchHistoryItem[]> = JSON.parse(rawHist);
        Object.entries(parsed).forEach(([k, v]) => this.history.set(k.toLowerCase(), v));
      } else {
        this.seedInitialHistory();
      }
    } catch {
      this.seedInitialRankings();
      this.seedInitialHistory();
    }
  }

  private saveState() {
    try {
      if (typeof localStorage === 'undefined') return;
      const list = Array.from(this.players.values());
      localStorage.setItem(STORAGE_RANKINGS_KEY, JSON.stringify(list));

      const histObj: Record<string, MatchHistoryItem[]> = {};
      this.history.forEach((v, k) => {
        histObj[k] = v;
      });
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(histObj));
    } catch {
      // ignore
    }
  }

  private seedInitialRankings() {
    const seeds: PlayerRankings[] = [
      {
        address: 'GB7AYO7KINGS4GHANA444444444444444444444444444444444AYO',
        rating: 1540,
        matchesPlayed: 42,
        wins: 34,
        losses: 6,
        draws: 2,
        earningsXlm: 340.5,
        currentStreak: 5,
        bestStreak: 12,
      },
      {
        address: 'GACHIEFTAIN8LAGOS88888888888888888888888888888888888AYO',
        rating: 1425,
        matchesPlayed: 28,
        wins: 21,
        losses: 5,
        draws: 2,
        earningsXlm: 215.0,
        currentStreak: 3,
        bestStreak: 7,
      },
      {
        address: 'GAAYOCHAINP1ALICE777777777777777777777777777777777777AYO1',
        rating: 1320,
        matchesPlayed: 16,
        wins: 11,
        losses: 4,
        draws: 1,
        earningsXlm: 85.0,
        currentStreak: 2,
        bestStreak: 4,
      },
      {
        address: 'GAAYOCHAINP2BOB88888888888888888888888888888888888888AYO2',
        rating: 1210,
        matchesPlayed: 14,
        wins: 7,
        losses: 6,
        draws: 1,
        earningsXlm: 15.0,
        currentStreak: 1,
        bestStreak: 3,
      },
      {
        address: 'GDKUMASI9WARRIOR999999999999999999999999999999999999AYO',
        rating: 1090,
        matchesPlayed: 9,
        wins: 3,
        losses: 6,
        draws: 0,
        earningsXlm: -25.0,
        currentStreak: 0,
        bestStreak: 2,
      },
    ];

    seeds.forEach((s) => this.players.set(s.address.toLowerCase(), s));
    this.saveState();
  }

  private seedInitialHistory() {
    const alice = 'GAAYOCHAINP1ALICE777777777777777777777777777777777777AYO1'.toLowerCase();
    this.history.set(alice, [
      {
        id: 'hist-1',
        opponent: 'GACHIEFTAIN8LAGOS88888888888888888888888888888888888AYO',
        outcome: 'Won',
        wager: '10 XLM',
        ratingDelta: +18,
        date: Date.now() - 1000 * 60 * 60 * 2,
        p1Seeds: 27,
        p2Seeds: 21,
      },
      {
        id: 'hist-2',
        opponent: 'GB7AYO7KINGS4GHANA444444444444444444444444444444444AYO',
        outcome: 'Lost',
        wager: '25 XLM',
        ratingDelta: -12,
        date: Date.now() - 1000 * 60 * 60 * 18,
        p1Seeds: 19,
        p2Seeds: 29,
      },
      {
        id: 'hist-3',
        opponent: 'GAAYOCHAINP2BOB88888888888888888888888888888888888888AYO2',
        outcome: 'Won',
        wager: '10 XLM',
        ratingDelta: +16,
        date: Date.now() - 1000 * 60 * 60 * 48,
        p1Seeds: 26,
        p2Seeds: 22,
      },
    ]);
    this.saveState();
  }

  public getLeaderboard(): PlayerRankings[] {
    return Array.from(this.players.values()).sort((a, b) => b.rating - a.rating);
  }

  public getPlayer(address: string): PlayerRankings {
    const key = address.toLowerCase();
    const existing = this.players.get(key);
    if (existing) return existing;

    const defaultStats: PlayerRankings = {
      address,
      rating: 1200,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      earningsXlm: 0,
      currentStreak: 0,
      bestStreak: 0,
    };
    this.players.set(key, defaultStats);
    this.saveState();
    return defaultStats;
  }

  public getHistory(address: string): MatchHistoryItem[] {
    return this.history.get(address.toLowerCase()) || [];
  }

  public recordMatchOutcome(
    p1Addr: string,
    p2Addr: string,
    outcome: 'Player1Won' | 'Player2Won' | 'Draw',
    wagerNumber: number,
    p1Seeds: number,
    p2Seeds: number
  ) {
    const p1 = this.getPlayer(p1Addr);
    const p2 = this.getPlayer(p2Addr);

    const diff = Math.max(-400, Math.min(400, p1.rating - p2.rating));
    const expected1 = 500 + Math.floor((diff * 5) / 4);
    const actual1 = outcome === 'Player1Won' ? 1000 : outcome === 'Draw' ? 500 : 0;
    const k = Math.floor((p1.matchesPlayed < 10 ? 40 : 24 + (p2.matchesPlayed < 10 ? 40 : 24)) / 2);
    const delta1 = Math.floor((k * (actual1 - expected1)) / 1000);

    p1.rating = Math.max(100, p1.rating + delta1);
    p2.rating = Math.max(100, p2.rating - delta1);
    p1.matchesPlayed++;
    p2.matchesPlayed++;

    if (outcome === 'Player1Won') {
      p1.wins++;
      p1.currentStreak++;
      if (p1.currentStreak > p1.bestStreak) p1.bestStreak = p1.currentStreak;
      p1.earningsXlm += wagerNumber;

      p2.losses++;
      p2.currentStreak = 0;
      p2.earningsXlm -= wagerNumber;
    } else if (outcome === 'Player2Won') {
      p2.wins++;
      p2.currentStreak++;
      if (p2.currentStreak > p2.bestStreak) p2.bestStreak = p2.currentStreak;
      p2.earningsXlm += wagerNumber;

      p1.losses++;
      p1.currentStreak = 0;
      p1.earningsXlm -= wagerNumber;
    } else {
      p1.draws++;
      p2.draws++;
      p1.currentStreak = 0;
      p2.currentStreak = 0;
    }

    this.players.set(p1Addr.toLowerCase(), p1);
    this.players.set(p2Addr.toLowerCase(), p2);

    // Record histories
    const p1Hist = this.getHistory(p1Addr);
    p1Hist.unshift({
      id: `match-${Date.now()}-p1`,
      opponent: p2Addr,
      outcome: outcome === 'Player1Won' ? 'Won' : outcome === 'Draw' ? 'Draw' : 'Lost',
      wager: `${wagerNumber} XLM`,
      ratingDelta: delta1,
      date: Date.now(),
      p1Seeds,
      p2Seeds,
    });
    this.history.set(p1Addr.toLowerCase(), p1Hist);

    const p2Hist = this.getHistory(p2Addr);
    p2Hist.unshift({
      id: `match-${Date.now()}-p2`,
      opponent: p1Addr,
      outcome: outcome === 'Player2Won' ? 'Won' : outcome === 'Draw' ? 'Draw' : 'Lost',
      wager: `${wagerNumber} XLM`,
      ratingDelta: -delta1,
      date: Date.now(),
      p1Seeds: p2Seeds,
      p2Seeds: p1Seeds,
    });
    this.history.set(p2Addr.toLowerCase(), p2Hist);

    this.saveState();
  }
}

export const rankings = new RankingsService();
