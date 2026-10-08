import React from 'react';
import { SeedVisual } from './SeedVisual';

interface StoreProps {
  playerLabel: string;
  capturedCount: number;
  position: 'west' | 'east';
  isLeader?: boolean;
}

export const Store: React.FC<StoreProps> = ({
  playerLabel,
  capturedCount,
  position,
  isLeader,
}) => {
  const percentage = Math.min(100, Math.round((capturedCount / 25) * 100));

  return (
    <div className={`store-trough store-${position} ${isLeader ? 'is-leader' : ''}`}>
      <div className="store-header">
        <span className="store-title">{playerLabel}</span>
        <span className="store-score">{capturedCount} / 25</span>
      </div>

      <div className="store-bowl">
        <SeedVisual count={capturedCount} maxDisplay={16} />
      </div>

      <div className="store-progress-track">
        <div
          className="store-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
