import React, { useState } from 'react';
import { X, Coins, ShieldCheck, Flame } from 'lucide-react';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (wager: string) => void;
}

const PRESET_WAGERS = ['5', '10', '25', '50', '100'];

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [selectedWager, setSelectedWager] = useState('10');
  const [customWager, setCustomWager] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  if (!isOpen) return null;

  const currentWagerAmount = useCustom ? (customWager || '0') : selectedWager;
  const potAmount = (parseFloat(currentWagerAmount) * 2).toFixed(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(currentWagerAmount) <= 0) return;
    onCreate(`${currentWagerAmount} XLM`);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Coins className="modal-icon-gold" size={24} />
            <h2 className="modal-title">Create On-Chain Ayo Match</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <p className="form-description">
            Deposit an escrow wager into the Stellar Soroban match referee contract.
            The opponent will match your wager to activate the game.
          </p>

          <div className="form-group">
            <label className="form-label">Select Wager Amount (XLM)</label>
            <div className="wager-presets-grid">
              {PRESET_WAGERS.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  className={`wager-chip ${
                    !useCustom && selectedWager === amt ? 'active' : ''
                  }`}
                  onClick={() => {
                    setSelectedWager(amt);
                    setUseCustom(false);
                  }}
                >
                  <Flame size={14} />
                  <span>{amt} XLM</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Or Custom Amount</label>
            <div className="custom-input-wrapper">
              <input
                type="number"
                min="1"
                step="0.5"
                placeholder="Enter custom XLM"
                value={customWager}
                onChange={(e) => {
                  setCustomWager(e.target.value);
                  setUseCustom(true);
                }}
                className="custom-wager-input"
              />
              <span className="input-currency-tag">XLM</span>
            </div>
          </div>

          <div className="pot-preview-box">
            <div className="pot-preview-row">
              <span className="pot-preview-label">Your Escrow Deposit:</span>
              <span className="pot-preview-value">{currentWagerAmount} XLM</span>
            </div>
            <div className="pot-preview-row">
              <span className="pot-preview-label">Total Winner Pot:</span>
              <span className="pot-preview-highlight">{potAmount} XLM</span>
            </div>
            <div className="pot-preview-note">
              <ShieldCheck size={14} />
              <span>Full wager refunded if no opponent joins and you cancel.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-action-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-action-btn">
              <Coins size={16} />
              <span>Escrow & Create Match</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
