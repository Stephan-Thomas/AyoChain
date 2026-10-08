import React, { useState } from 'react';
import { Volume2, VolumeX, BookOpen, Shield, Wallet as WalletIcon, RefreshCw } from 'lucide-react';
import { wallet } from '../services/wallet';
import type { WalletState } from '../services/wallet';
import { sound } from '../services/audio';

interface NavbarProps {
  walletState: WalletState;
  activeTab: 'lobby' | 'game' | 'practice' | 'leaderboard' | 'profile';
  onSelectTab: (tab: 'lobby' | 'game' | 'practice' | 'leaderboard' | 'profile') => void;
  onOpenRules: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  walletState,
  activeTab,
  onSelectTab,
  onOpenRules,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
    if (next) sound.playSeedClack();
  };

  const handleConnect = async () => {
    const success = await wallet.connectFreighter();
    if (!success) {
      // Prompt quick simulated fallback
      wallet.connectSimulated('alice');
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Brand Logo */}
        <div className="brand-group" onClick={() => onSelectTab('lobby')}>
          <div className="brand-emblem">
            <span className="brand-glyph">✦</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">AYOCHAIN</span>
            <span className="brand-sub">SOROBAN REFEREE</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="header-nav">
          <button
            className={`nav-tab-btn ${activeTab === 'lobby' ? 'active' : ''}`}
            onClick={() => onSelectTab('lobby')}
          >
            Lobby & Wagers
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'game' ? 'active' : ''}`}
            onClick={() => onSelectTab('game')}
          >
            Live Match
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'practice' ? 'active' : ''}`}
            onClick={() => onSelectTab('practice')}
          >
            Solo AI Practice
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('leaderboard')}
          >
            Hall of Champions
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => onSelectTab('profile')}
          >
            My Profile
          </button>
        </nav>

        {/* Action Controls */}
        <div className="header-actions">
          {/* Rules Guide Button */}
          <button
            className="action-icon-btn"
            onClick={onOpenRules}
            title="Abapa Rules & Strategy"
          >
            <BookOpen size={18} />
            <span className="btn-label-desktop">Rules</span>
          </button>

          {/* Sound Toggle */}
          <button
            className="action-icon-btn"
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Wallet Connection */}
          <div className="wallet-wrapper">
            {walletState.isConnected ? (
              <div className="wallet-connected-pill" onClick={() => setShowWalletMenu(!showWalletMenu)}>
                <span className="network-dot" />
                <span className="wallet-balance">{walletState.balance} XLM</span>
                <span className="wallet-address-short">{truncateAddress(walletState.address || '')}</span>
              </div>
            ) : (
              <button className="connect-wallet-btn" onClick={handleConnect}>
                <WalletIcon size={16} />
                <span>Connect Wallet</span>
              </button>
            )}

            {/* Wallet Dropdown Menu */}
            {showWalletMenu && (
              <div className="wallet-dropdown glass-panel">
                <div className="dropdown-section">
                  <span className="dropdown-label">Network</span>
                  <span className="dropdown-value">{walletState.network}</span>
                </div>
                <div className="dropdown-section">
                  <span className="dropdown-label">Address</span>
                  <span className="dropdown-code">{walletState.address}</span>
                </div>
                {walletState.isSimulated && (
                  <div className="dropdown-banner">
                    <Shield size={14} />
                    <span>Testnet Sandbox Mode Active</span>
                  </div>
                )}
                <div className="dropdown-actions">
                  <button
                    className="dropdown-btn"
                    onClick={() => {
                      wallet.connectSimulated(
                        walletState.address?.includes('ALICE') ? 'bob' : 'alice'
                      );
                      setShowWalletMenu(false);
                    }}
                  >
                    <RefreshCw size={14} />
                    <span>Switch Sandbox Player ({walletState.address?.includes('ALICE') ? 'Bob' : 'Alice'})</span>
                  </button>
                  <button
                    className="dropdown-btn btn-danger"
                    onClick={() => {
                      wallet.disconnect();
                      setShowWalletMenu(false);
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
