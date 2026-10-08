import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Trophy, Flame, Coins, Shield, Clock } from 'lucide-react';
import { rankings, getRankTier } from '../../services/rankings';

interface ProfileViewProps {
  address: string;
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ address, onBack }) => {
  const [copied, setCopied] = useState(false);
  const stats = rankings.getPlayer(address);
  const history = rankings.getHistory(address);
  const allPlayers = rankings.getLeaderboard();

  const rankPosition = allPlayers.findIndex((p) => p.address.toLowerCase() === address.toLowerCase()) + 1;
  const tier = getRankTier(stats.rating);

  const winRate =
    stats.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncate = (s: string) => `${s.slice(0, 10)}...${s.slice(-8)}`;

  const formatElapsed = (timestamp: number) => {
    const min = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="profile-container">
      {/* Top Navigation */}
      <button className="back-link-btn" onClick={onBack}>
        <ArrowLeft size={16} />
        <span>Back to Hall of Champions</span>
      </button>

      {/* Profile Header Card */}
      <div className="profile-header-card glass-panel">
        <div className="profile-avatar-crest" style={{ borderColor: tier.color }}>
          <span className="crest-symbol">{tier.symbol}</span>
        </div>

        <div className="profile-details-wrap">
          <div className="profile-tier-row">
            <span className="profile-tier-pill" style={{ color: tier.color, borderColor: tier.color }}>
              {tier.title}
            </span>
            <span className="profile-rank-tag">Global Rank #{rankPosition || 'Unranked'}</span>
          </div>

          <div className="profile-address-row">
            <span className="full-address-mono">{truncate(address)}</span>
            <button className="copy-addr-btn" onClick={handleCopy} title="Copy Address">
              {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="profile-rating-badge">
          <span className="rating-num-large">{stats.rating}</span>
          <span className="rating-label">Elo Rating</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="profile-kpi-grid">
        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap icon-gold">
            <Trophy size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-val">{winRate}%</span>
            <span className="kpi-label">Win Rate</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap icon-flame">
            <Flame size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-val">
              {stats.currentStreak} <small>(Best: {stats.bestStreak})</small>
            </span>
            <span className="kpi-label">Win Streak</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap icon-coins">
            <Coins size={20} />
          </div>
          <div className="kpi-info">
            <span className={`kpi-val ${stats.earningsXlm >= 0 ? 'text-win' : 'text-loss'}`}>
              {stats.earningsXlm >= 0 ? `+${stats.earningsXlm}` : stats.earningsXlm} XLM
            </span>
            <span className="kpi-label">Net Escrow Won</span>
          </div>
        </div>

        <div className="kpi-card glass-panel">
          <div className="kpi-icon-wrap icon-shield">
            <Shield size={20} />
          </div>
          <div className="kpi-info">
            <span className="kpi-val">
              {stats.wins}W / {stats.losses}L / {stats.draws}D
            </span>
            <span className="kpi-label">Record ({stats.matchesPlayed} Matches)</span>
          </div>
        </div>
      </div>

      {/* Recent Match History Timeline */}
      <div className="profile-history-section glass-panel">
        <div className="section-title-wrap">
          <h2 className="section-title">On-Chain Match History</h2>
          <span className="match-count-tag">{history.length} Recorded</span>
        </div>

        {history.length === 0 ? (
          <div className="empty-history-msg">
            <p>No verified on-chain matches recorded for this warrior yet.</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div key={item.id} className={`history-item-row outcome-${item.outcome.toLowerCase()}`}>
                <div className="history-left">
                  <span className={`outcome-pill pill-${item.outcome.toLowerCase()}`}>
                    {item.outcome}
                  </span>
                  <div className="history-opp-info">
                    <span className="opp-label">vs {truncate(item.opponent)}</span>
                    <span className="time-sub">
                      <Clock size={12} /> {formatElapsed(item.date)}
                    </span>
                  </div>
                </div>

                <div className="history-center">
                  <span className="seeds-tally">
                    {item.p1Seeds} - {item.p2Seeds} Seeds
                  </span>
                  <span className="wager-tag">Wager: {item.wager}</span>
                </div>

                <div className="history-right">
                  <span className={`delta-tag ${item.ratingDelta >= 0 ? 'pos' : 'neg'}`}>
                    {item.ratingDelta >= 0 ? `+${item.ratingDelta}` : item.ratingDelta} Elo
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
