import React from 'react';
import { SeedVisual } from './SeedVisual';

interface PitProps {
  pitIndex: number;
  displayNumber: number;
  seedCount: number;
  isLegal: boolean;
  isMySide: boolean;
  isCurrentTurn: boolean;
  isRecentlySown?: boolean;
  isRecentlyCaptured?: boolean;
  onSelect: (pitIndex: number) => void;
}

export const Pit: React.FC<PitProps> = ({
  pitIndex,
  displayNumber,
  seedCount,
  isLegal,
  isMySide,
  isCurrentTurn,
  isRecentlySown,
  isRecentlyCaptured,
  onSelect,
}) => {
  const isClickable = isLegal && isCurrentTurn;

  const handleClick = () => {
    if (isClickable) {
      onSelect(pitIndex);
    }
  };

  return (
    <div
      className={`pit-wrapper ${isMySide ? 'my-side' : 'opp-side'}`}
      onClick={handleClick}
    >
      <div className="pit-meta-top">
        <span className="pit-num-label">#{displayNumber}</span>
        {isLegal && isCurrentTurn && (
          <span className="pit-ready-dot" title="Legal Move" />
        )}
      </div>

      <div
        className={`pit-bowl ${isClickable ? 'clickable-pit' : ''} ${
          isRecentlySown ? 'recently-sown' : ''
        } ${isRecentlyCaptured ? 'recently-captured' : ''}`}
      >
        <SeedVisual count={seedCount} />

        <div className={`seed-badge ${seedCount > 0 ? 'has-seeds' : 'empty-seeds'}`}>
          {seedCount}
        </div>
      </div>
    </div>
  );
};
