import React from 'react';
import { X, CheckCircle2, AlertTriangle, Crown, Sparkles } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Sparkles className="modal-icon-gold" size={24} />
            <h2 className="modal-title">Abapa Rules & Strategy Guide</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body rules-scrollable">
          <section className="rule-card">
            <h3 className="rule-heading">
              <span className="rule-badge">1</span> Board & Initial Setup
            </h3>
            <p>
              The board consists of 12 carved pits divided into two territories: 
              <strong> South (Pits 1–6)</strong> for Player 1, and <strong>North (Pits 1–6)</strong> for Player 2.
              Each pit starts loaded with exactly <strong>4 seeds</strong> (48 seeds total).
            </p>
          </section>

          <section className="rule-card">
            <h3 className="rule-heading">
              <span className="rule-badge">2</span> Counter-Clockwise Sowing & The Kroo
            </h3>
            <p>
              On your turn, choose any pit on your side containing seeds. Pick up all seeds and sow them 
              <strong> one-by-one counter-clockwise</strong> into consecutive pits.
            </p>
            <div className="rule-callout">
              <strong>The Kroo Rule (12+ Seeds):</strong> If a pit holds 12 or more seeds, a full lap occurs.
              You must <em>skip the original starting pit</em> during sowing, leaving it empty.
            </div>
          </section>

          <section className="rule-card">
            <h3 className="rule-heading">
              <span className="rule-badge">3</span> Capturing (2 or 3 Seeds)
            </h3>
            <p>
              A capture occurs when the <strong>last seed</strong> you sow lands in a pit on the 
              <strong> opponent's side</strong>, bringing the total count in that pit to 
              <strong> exactly 2 or 3 seeds</strong>.
            </p>
            <p>
              <strong>Continuous Backward Chain:</strong> You also capture preceding pits on the opponent's side 
              if they also contain 2 or 3 seeds, continuing backwards until a pit has fewer than 2 or more than 3 seeds.
            </p>
          </section>

          <section className="rule-card">
            <h3 className="rule-heading">
              <span className="rule-badge">4</span> The Grand Slam Rule (Fairness Guard)
            </h3>
            <p>
              <AlertTriangle className="rule-warn-icon" size={16} />
              If a capture would seize <em>every single seed</em> on the opponent's side, leaving them with zero seeds,
              the capture is voided! The seeds remain in the pits so the match can continue.
            </p>
          </section>

          <section className="rule-card">
            <h3 className="rule-heading">
              <span className="rule-badge">5</span> Mandatory Feeding Rule
            </h3>
            <p>
              If your opponent has no seeds on their side, you <strong>must</strong> choose a move that sows 
              seeds across the boundary into their territory if such a move exists.
            </p>
          </section>

          <section className="rule-card highlight-card">
            <h3 className="rule-heading">
              <Crown className="rule-icon-gold" size={18} />
              Victory & Payout Condition
            </h3>
            <p>
              The first player to capture <strong>25 or more seeds</strong> claims immediate victory! 
              The on-chain Soroban match contract automatically releases the escrowed token pot to the winner's wallet.
              If the final tally reaches 24–24, the match is a draw and the pot is split equally.
            </p>
          </section>
        </div>

        <div className="modal-footer">
          <button className="primary-action-btn" onClick={onClose}>
            <CheckCircle2 size={16} />
            <span>Understood, Let's Play!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
