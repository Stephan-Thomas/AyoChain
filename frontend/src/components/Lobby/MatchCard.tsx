import React from 'react';
import { Coins, Clock, User, ArrowRight, XCircle } from 'lucide-react';
import type { MatchInfo } from '../../types/game';

interface MatchCardProps {
  match: MatchInfo;
  userAddress: string | null;
  onJoin: (matchId: string) => void;
  onSelect: (matchId: string) => void;
  onCancel: (matchId: string) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  userAddress,
  onJoin,
  onSelect,
  onCancel,
}) => {
  const isCreator = userAddress && match.creator.toLowerCase() === userAddress.toLowerCase();
  const isParticipant =
    userAddress &&
    (match.creator.toLowerCase() === userAddress.toLowerCase() ||
      (match.opponent && match.opponent.toLowerCase() === userAddress.toLowerCase()));

  const truncate = (s: string) => `${s.slice(0, 6)}...${s.slice(-4)}`;

  const formatElapsed = (timestamp: number) => {
    const min = Math.floor((Date.now() - timestamp) / (1000 * 60));
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hours = Math.floor(min / 60);
    return `${hours}h ago`;
  };

  const potNumber = parseFloat(match.wagerAmount.replace(/[^\d.]/g, '')) * 2;
  const potDisplay = isNaN(potNumber) ? match.wagerAmount : `${potNumber} XLM`;

  return (
    <div className={`match-card glass-panel status-${match.status.toLowerCase()}`}>
      <div className="card-top-row">
        <div className="card-wager-pill">
          <Coins size={14} />
          <span>Wager: {match.wagerAmount}</span>
        </div>
        <span className={`status-badge badge-${match.status.toLowerCase()}`}>
          {match.status}
        </span>
      </div>

      <div className="card-pot-display">
        <span className="pot-label">Winner Takes</span>
        <span className="pot-value gold-gradient-text">{potDisplay}</span>
      </div>

      <div className="card-meta">
        <div className="meta-item">
          <User size={14} />
          <span>Creator: {truncate(match.creator)}</span>
        </div>
        <div className="meta-item">
          <Clock size={14} />
          <span>Created: {formatElapsed(match.createdAt)}</span>
        </div>
      </div>

      <div className="card-actions">
        {match.status === 'Pending' && !isCreator && (
          <button className="primary-action-btn w-full" onClick={() => onJoin(match.id)}>
            <span>Match Wager & Play</span>
            <ArrowRight size={16} />
          </button>
        )}

        {match.status === 'Pending' && isCreator && (
          <div className="creator-pending-group">
            <span className="waiting-pill">Waiting for opponent...</span>
            <button className="icon-cancel-btn" onClick={() => onCancel(match.id)} title="Cancel & Refund">
              <XCircle size={18} />
            </button>
          </div>
        )}

        {match.status === 'Active' && (
          <button className="secondary-action-btn w-full" onClick={() => onSelect(match.id)}>
            <span>{isParticipant ? 'Enter Match' : 'Spectate Match'}</span>
            <ArrowRight size={16} />
          </button>
        )}

        {match.status === 'Completed' && (
          <button className="secondary-action-btn w-full" onClick={() => onSelect(match.id)}>
            <span>View Board</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
