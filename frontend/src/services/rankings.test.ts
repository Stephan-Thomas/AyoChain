import { describe, it, expect } from 'vitest';
import { rankings, getRankTier } from './rankings';

describe('RankingsService & Elo Engine', () => {
  it('correctly maps Elo rating ranges to West African honorific rank tiers', () => {
    expect(getRankTier(1600).title).toBe('Ayo Grandmaster');
    expect(getRankTier(1500).title).toBe('Ayo Grandmaster');
    expect(getRankTier(1400).title).toBe('Royal Elder');
    expect(getRankTier(1300).title).toBe('Royal Elder');
    expect(getRankTier(1200).title).toBe('Village Challenger');
    expect(getRankTier(1100).title).toBe('Village Challenger');
    expect(getRankTier(1000).title).toBe('Oware Initiate');
  });

  it('updates ratings and streaks upon match outcome', () => {
    const p1 = 'GATEST_P1_WARRIOR';
    const p2 = 'GATEST_P2_WARRIOR';

    rankings.recordMatchOutcome(p1, p2, 'Player1Won', 10, 26, 22);

    const stats1 = rankings.getPlayer(p1);
    const stats2 = rankings.getPlayer(p2);

    // Initial equal rating (1200), P1 wins -> P1 rating increases, P2 decreases
    expect(stats1.rating).toBeGreaterThan(1200);
    expect(stats2.rating).toBeLessThan(1200);
    expect(stats1.wins).toBe(1);
    expect(stats1.currentStreak).toBe(1);
    expect(stats1.bestStreak).toBe(1);
    expect(stats1.earningsXlm).toBe(10);

    expect(stats2.losses).toBe(1);
    expect(stats2.currentStreak).toBe(0);
    expect(stats2.earningsXlm).toBe(-10);

    // Check history was recorded
    const history1 = rankings.getHistory(p1);
    expect(history1.length).toBe(1);
    expect(history1[0].outcome).toBe('Won');
    expect(history1[0].opponent).toBe(p2);
  });

  it('preserves best streak when a player loses', () => {
    const p1 = 'GATEST_STREAK_PLAYER';
    const p2 = 'GATEST_OPPONENT';

    // Win twice
    rankings.recordMatchOutcome(p1, p2, 'Player1Won', 5, 25, 23);
    rankings.recordMatchOutcome(p1, p2, 'Player1Won', 5, 27, 21);

    let stats = rankings.getPlayer(p1);
    expect(stats.currentStreak).toBe(2);
    expect(stats.bestStreak).toBe(2);

    // Lose once
    rankings.recordMatchOutcome(p1, p2, 'Player2Won', 5, 20, 28);
    stats = rankings.getPlayer(p1);
    expect(stats.currentStreak).toBe(0);
    expect(stats.bestStreak).toBe(2);
  });
});
