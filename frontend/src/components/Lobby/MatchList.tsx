import React, { useState } from 'react';
import { Plus, Bot, Trophy, Sparkles } from 'lucide-react';
import type { MatchInfo } from '../../types/game';
import { MatchCard } from './MatchCard';

interface MatchListProps {
  matches: MatchInfo[];
  userAddress: string | null;
  onOpenCreate: () => void;
  onStartSoloAI: () => void;
  onJoinMatch: (matchId: string) => void;
  onSelectMatch: (matchId: string) => void;
  onCancelMatch: (matchId: string) => void;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  userAddress,
  onOpenCreate,
  onStartSoloAI,
  onJoinMatch,
  onSelectMatch,
  onCancelMatch,
}) => {
  const [filter, setFilter] = useState<'all' | 'open' | 'active'>('all');

  const filteredMatches = matches.filter((m) => {
    if (filter === 'open') return m.status === 'Pending';
    if (filter === 'active') return m.status === 'Active';
    return true;
  });

  return (
    <div className="lobby-container">
      {/* Hero Showcase */}
      <section className="lobby-hero glass-panel">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>SOROBAN SMART CONTRACT REFEREE</span>
          </div>
          <h1 className="hero-title">
            The Ancient Art of <span className="gold-gradient-text">Ayo</span> on Stellar
          </h1>
          <p className="hero-description">
            Experience authentic Abapa rules played for centuries across West Africa.
            Every pit sow, Kroo lap, and continuous capture is verified on-chain with instant trustless XLM escrow payouts.
          </p>

          <div className="hero-action-row">
            <button className="primary-action-btn hero-primary" onClick={onOpenCreate}>
              <Plus size={18} />
              <span>Create Wager Match</span>
            </button>
            <button className="secondary-action-btn hero-secondary" onClick={onStartSoloAI}>
              <Bot size={18} />
              <span>Play vs Ayo Grandmaster AI</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="hero-features-list">
          <div className="feature-pill">
            <div className="feature-dot" />
            <div>
              <strong>48 Seeds & 12 Pits</strong>
              <span>Strict Abapa Rules Engine</span>
            </div>
          </div>
          <div className="feature-pill">
            <div className="feature-dot" />
            <div>
              <strong>Instant Escrow Payouts</strong>
              <span>Soroban Token Settlement</span>
            </div>
          </div>
          <div className="feature-pill">
            <div className="feature-dot" />
            <div>
              <strong>24h Timeout Defense</strong>
              <span>Anti-stalling on-chain forfeiture</span>
            </div>
          </div>
        </div>
      </section>

      {/* Arena Lobby Header */}
      <div className="lobby-section-header">
        <div className="section-title-wrap">
          <h2 className="section-title">Open Matches & Arena Challenges</h2>
          <span className="match-count-tag">{matches.length} Total</span>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Open Challenges
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            In-Progress
          </button>
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="empty-matches-state glass-panel">
          <Trophy size={40} className="empty-icon" />
          <h3 className="empty-title">No Challenges Currently In This Filter</h3>
          <p className="empty-desc">
            Be the warrior to issue a challenge! Set your wager and wait for an opponent.
          </p>
          <button className="primary-action-btn" onClick={onOpenCreate}>
            <Plus size={16} />
            <span>Create First Wager</span>
          </button>
        </div>
      ) : (
        <div className="matches-grid">
          {filteredMatches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              userAddress={userAddress}
              onJoin={onJoinMatch}
              onSelect={onSelectMatch}
              onCancel={onCancelMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
};
