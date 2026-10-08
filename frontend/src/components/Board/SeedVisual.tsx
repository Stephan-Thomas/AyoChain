import React from 'react';

interface SeedVisualProps {
  count: number;
  maxDisplay?: number;
}

export const SeedVisual: React.FC<SeedVisualProps> = ({ count, maxDisplay = 8 }) => {
  if (count === 0) {
    return <div className="seeds-empty" />;
  }

  const displayCount = Math.min(count, maxDisplay);
  const seedsArray = Array.from({ length: displayCount });

  // Deterministic seed scatter rotation and offset offsets
  const getSeedStyle = (index: number) => {
    const angle = (index * 137.5) % 360; // Golden angle distribution
    const radius = Math.min(18, 5 + index * 2.2);
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    const rotation = (index * 47) % 180;

    return {
      transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
      zIndex: index + 1,
    };
  };

  return (
    <div className="seeds-cluster" title={`${count} seeds`}>
      {seedsArray.map((_, i) => (
        <div key={i} className="cowrie-seed" style={getSeedStyle(i)}>
          <div className="cowrie-slit" />
        </div>
      ))}
      {count > maxDisplay && (
        <span className="seeds-overflow-badge">+{count - maxDisplay}</span>
      )}
    </div>
  );
};
