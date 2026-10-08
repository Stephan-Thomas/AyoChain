import React, { useState } from 'react';
import { Trophy, Search, ShieldCheck, Flame } from 'lucide-react';
import { rankings, getRankTier } from '../../services/rankings';

interface LeaderboardProps {
  onSelectPlayer: (address: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onSelectPlayer }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const allPlayers = rankings.getLeaderboard();

  const filtered = allPlayers.filter((p) =>
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const truncate = (s: string) => `${s.slice(0, 8)}...${s.slice(-6)}`;

  return (
    <div className="leaderboard-container">
      {/* Header Banner */}
      <div className="leaderboard-hero glass-panel">
        <div className="leaderboard-hero-crest">
          <Trophy size={42} className="trophy-gold" />
        </div>
        <div className="leaderboard-hero-content">
          <h1 className="hero-title">
            AyoChain <span className="gold-gradient-text">Hall of Champions</span>
          </h1>
          <p className="hero-description">
            The grand arena of on-chain warriors. Elo ratings are computed on Soroban smart contracts
            with dynamic K-factors and instant escrow settlement.
          </p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="leaderboard-controls-row">
        <div className="search-bar-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search warrior by Stellar address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="leaderboard-stats-count">
          <ShieldCheck size={16} />
          <span>{allPlayers.length} Ranked Warriors</span>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="leaderboard-table-wrap glass-panel">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="th-rank">Rank</th>
              <th className="th-player">Warrior</th>
              <th className="th-tier">Master Tier</th>
              <th className="th-rating">Elo Rating</th>
              <th className="th-record">Record (W-L-D)</th>
              <th className="th-winrate">Win Rate</th>
              <th className="th-earnings">Net Won</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((player, idx) => {
              const tier = getRankTier(player.rating);
              const winRate =
                player.matchesPlayed > 0
                  ? Math.round((player.wins / player.matchesPlayed) * 100)
                  : 0;

              return (
                <tr
                  key={player.address}
                  className={`rank-row ${idx < 3 ? `top-rank-${idx + 1}` : ''}`}
                  onClick={() => onSelectPlayer(player.address)}
                >
                  <td className="td-rank">
                    {idx === 0 ? (
                      <span className="medal medal-gold">1 👑</span>
                    ) : idx === 1 ? (
                      <span className="medal medal-silver">2 🥈</span>
                    ) : idx === 2 ? (
                      <span className="medal medal-bronze">3 🥉</span>
                    ) : (
                      <span className="rank-num">#{idx + 1}</span>
                    )}
                  </td>
                  <td className="td-player">
                    <div className="player-identity-cell">
                      <div className="avatar-chip" style={{ borderColor: tier.color }}>
                        {tier.symbol}
                      </div>
                      <div className="address-labels">
                        <span className="player-addr">{truncate(player.address)}</span>
                        {player.currentStreak >= 3 && (
                          <span className="streak-tag">
                            <Flame size={12} /> {player.currentStreak} streak!
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="td-tier">
                    <span className="tier-badge" style={{ color: tier.color, borderColor: tier.color }}>
                      {tier.title}
                    </span>
                  </td>
                  <td className="td-rating">
                    <span className="rating-score">{player.rating}</span>
                  </td>
                  <td className="td-record">
                    <span className="record-stat">
                      <strong className="text-win">{player.wins}W</strong> -{' '}
                      <strong className="text-loss">{player.losses}L</strong> -{' '}
                      <strong className="text-draw">{player.draws}D</strong>
                    </span>
                  </td>
                  <td className="td-winrate">
                    <div className="winrate-bar-wrap">
                      <span className="winrate-text">{winRate}%</span>
                      <div className="winrate-bar">
                        <div className="winrate-fill" style={{ width: `${winRate}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="td-earnings">
                    <span className={`earnings-val ${player.earningsXlm >= 0 ? 'pos' : 'neg'}`}>
                      {player.earningsXlm >= 0 ? `+${player.earningsXlm}` : player.earningsXlm} XLM
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
