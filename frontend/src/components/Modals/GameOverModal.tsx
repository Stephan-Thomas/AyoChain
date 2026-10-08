import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, ArrowRight, RotateCcw } from 'lucide-react';
import type { MatchOutcome, BoardState } from '../../types/game';
import { sound } from '../../services/audio';

interface GameOverModalProps {
  isOpen: boolean;
  winner: MatchOutcome;
  board: BoardState;
  wagerAmount: string;
  isSoloMode?: boolean;
  onRematch: () => void;
  onReturnLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  board,
  wagerAmount,
  isSoloMode,
  onRematch,
  onReturnLobby,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playVictoryFanfare();
      // Celebration confetti shower
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#e5a93c', '#f5bc54', '#d96b43', '#10b981', '#ffffff'],
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isP1Won = winner === 'Player1Won';
  const isP2Won = winner === 'Player2Won';
  const isDraw = winner === 'Draw';

  const potNumber = parseFloat(wagerAmount.replace(/[^\d.]/g, '')) * 2;
  const potDisplay = isNaN(potNumber) ? '20 XLM' : `${potNumber} XLM`;

  return (
    <div className="modal-overlay">
      <div className="modal-dialog glass-panel game-over-dialog">
        <div className="game-over-banner">
          <div className="trophy-crest">
            <Trophy size={48} className="trophy-gold-icon" />
          </div>

          <h2 className="game-over-title gold-gradient-text">
            {isDraw ? 'Honorable Draw!' : isP1Won ? 'Player 1 Victorious!' : 'Player 2 Victorious!'}
          </h2>
          <p className="game-over-subtitle">
            {isSoloMode
              ? isP1Won
                ? 'You triumphed over the Ayo Grandmaster AI!'
                : 'The Ayo Grandmaster outcalculated the board!'
              : isDraw
              ? 'Both masters shared equal wisdom and score.'
              : 'The on-chain referee has verified the victory.'}
          </p>
        </div>

        {/* Score comparison pill */}
        <div className="score-tally-container">
          <div className={`score-side ${isP1Won ? 'winner-side' : ''}`}>
            <span className="player-tag">Player 1 (South)</span>
            <span className="captured-total">{board.p1_captured}</span>
            <span className="captured-label">Seeds Captured</span>
          </div>

          <div className="score-vs-divider">VS</div>

          <div className={`score-side ${isP2Won ? 'winner-side' : ''}`}>
            <span className="player-tag">Player 2 (North)</span>
            <span className="captured-total">{board.p2_captured}</span>
            <span className="captured-label">Seeds Captured</span>
          </div>
        </div>

        {/* Payout Banner */}
        <div className="escrow-payout-box">
          <Award className="escrow-icon" size={24} />
          <div className="escrow-details">
            <span className="escrow-title">Total Escrow Pot: {potDisplay}</span>
            <span className="escrow-sub">
              {isDraw
                ? 'Pot split 50/50 and refunded to players.'
                : `Payout transferred directly to winner's wallet.`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="game-over-actions">
          <button className="primary-action-btn" onClick={onRematch}>
            <RotateCcw size={16} />
            <span>Play Rematch</span>
          </button>
          <button className="secondary-action-btn" onClick={onReturnLobby}>
            <span>Return to Lobby</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
