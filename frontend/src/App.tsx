import { useState, useEffect } from 'react';
import './App.css';
import { Navbar } from './components/Navbar';
import { MatchList } from './components/Lobby/MatchList';
import { GameView } from './components/GameView';
import { Leaderboard } from './components/Rankings/Leaderboard';
import { ProfileView } from './components/Profile/ProfileView';
import { RulesModal } from './components/Modals/RulesModal';
import { CreateMatchModal } from './components/Modals/CreateMatchModal';
import { wallet } from './services/wallet';
import type { WalletState } from './services/wallet';
import { soroban } from './services/soroban';
import { rankings } from './services/rankings';
import type { MatchInfo, Player } from './types/game';
import { getInitialBoard } from './engine/ayoRules';

export function App() {
  const [walletState, setWalletState] = useState<WalletState>(wallet.getState());
  const [activeTab, setActiveTab] = useState<'lobby' | 'game' | 'practice' | 'leaderboard' | 'profile'>('lobby');
  const [matches, setMatches] = useState<MatchInfo[]>(() => soroban.getMatches());
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [soloMatch, setSoloMatch] = useState<MatchInfo | null>(null);
  const [viewedProfileAddress, setViewedProfileAddress] = useState<string | null>(null);

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const unsub = wallet.subscribe((ws) => {
      setWalletState(ws);
    });
    return () => unsub();
  }, []);

  const refreshMatches = () => {
    setMatches(soroban.getMatches());
  };

  const handleOpenCreate = () => {
    if (!walletState.isConnected) {
      wallet.connectSimulated('alice');
    }
    setIsCreateModalOpen(true);
  };

  const handleCreateMatch = (wagerAmount: string) => {
    const creator = walletState.address || 'GAAYOCHAINP1ALICE777777777777777777777777777777777777AYO1';
    const newMatch = soroban.createMatch(creator, wagerAmount);
    refreshMatches();
    setActiveMatchId(newMatch.id);
    setActiveTab('game');
  };

  const handleJoinMatch = (matchId: string) => {
    if (!walletState.isConnected) {
      wallet.connectSimulated('bob');
    }
    const currentAddr = wallet.getState().address || 'GAAYOCHAINP2BOB88888888888888888888888888888888888888AYO2';
    try {
      const updated = soroban.joinMatch(matchId, currentAddr);
      refreshMatches();
      setActiveMatchId(updated.id);
      setActiveTab('game');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelMatch = (matchId: string) => {
    const currentAddr = walletState.address || '';
    try {
      soroban.cancelMatch(matchId, currentAddr);
      refreshMatches();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectMatch = (matchId: string) => {
    setActiveMatchId(matchId);
    setActiveTab('game');
  };

  const handleStartSoloAI = () => {
    const practiceMatch: MatchInfo = {
      id: 'solo-practice',
      creator: walletState.address || 'GAAYOCHAINP1ALICE777777777777777777777777777777777777AYO1',
      opponent: 'Ayo Grandmaster AI',
      wagerAmount: '10 XLM',
      tokenAddress: 'Native XLM',
      createdAt: Date.now(),
      lastMoveTimestamp: Date.now(),
      status: 'Active',
      currentTurn: 'Player1',
      board: getInitialBoard(),
      winner: 'None',
    };
    setSoloMatch(practiceMatch);
    setActiveTab('practice');
  };

  const handleUpdateMatch = (updated: MatchInfo) => {
    if (activeTab === 'practice') {
      setSoloMatch(updated);
    } else {
      refreshMatches();
    }

    // Automatically record Elo and stats when match is decided
    if (updated.board.is_game_over && updated.winner !== 'None') {
      const p1 = updated.creator;
      const p2 = updated.opponent || 'Ayo Grandmaster AI';
      const wagerNum = parseFloat(updated.wagerAmount.replace(/[^\d.]/g, '')) || 10;
      const outcome =
        updated.winner === 'Player1Won'
          ? 'Player1Won'
          : updated.winner === 'Player2Won'
          ? 'Player2Won'
          : 'Draw';

      try {
        rankings.recordMatchOutcome(
          p1,
          p2,
          outcome,
          wagerNum,
          updated.board.p1_captured,
          updated.board.p2_captured
        );
      } catch (err) {
        console.error('Failed to record rankings outcome:', err);
      }
    }
  };

  const handleResign = (matchId: string, player: Player) => {
    if (activeTab === 'practice') {
      if (soloMatch) {
        const winner = player === 'Player1' ? 'Player2Won' : 'Player1Won';
        const updatedSolo: MatchInfo = {
          ...soloMatch,
          status: 'Completed',
          winner,
          board: {
            ...soloMatch.board,
            is_game_over: true,
            winner,
          },
        };
        setSoloMatch(updatedSolo);
        handleUpdateMatch(updatedSolo);
      }
    } else {
      try {
        const resignedMatch = soroban.resign(matchId, player);
        refreshMatches();
        handleUpdateMatch(resignedMatch);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleClaimTimeout = (matchId: string) => {
    try {
      const timedOutMatch = soroban.claimTimeout(matchId);
      refreshMatches();
      handleUpdateMatch(timedOutMatch);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectPlayerProfile = (address: string) => {
    setViewedProfileAddress(address);
    setActiveTab('profile');
  };

  const activeMatch = matches.find((m) => m.id === activeMatchId);
  const myAddress = walletState.address || 'GAAYOCHAINP1ALICE777777777777777777777777777777777777AYO1';

  return (
    <div className="app-root">
      <Navbar
        walletState={walletState}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'practice' && !soloMatch) {
            handleStartSoloAI();
          } else if (tab === 'profile') {
            setViewedProfileAddress(myAddress);
            setActiveTab('profile');
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenRules={() => setIsRulesModalOpen(true)}
      />

      <main className="main-content">
        {activeTab === 'lobby' && (
          <MatchList
            matches={matches}
            userAddress={walletState.address}
            onOpenCreate={handleOpenCreate}
            onStartSoloAI={handleStartSoloAI}
            onJoinMatch={handleJoinMatch}
            onSelectMatch={handleSelectMatch}
            onCancelMatch={handleCancelMatch}
          />
        )}

        {activeTab === 'game' && activeMatch && (
          <GameView
            match={activeMatch}
            userAddress={walletState.address}
            isSoloMode={false}
            onBackToLobby={() => setActiveTab('lobby')}
            onUpdateMatch={handleUpdateMatch}
            onResign={handleResign}
            onClaimTimeout={handleClaimTimeout}
          />
        )}

        {activeTab === 'game' && !activeMatch && (
          <div className="empty-matches-state glass-panel">
            <h3 className="empty-title">No Match Selected</h3>
            <p className="empty-desc">Choose an arena challenge from the lobby or create your own wager.</p>
            <button className="primary-action-btn" onClick={() => setActiveTab('lobby')}>
              Go to Arena Lobby
            </button>
          </div>
        )}

        {activeTab === 'practice' && soloMatch && (
          <GameView
            match={soloMatch}
            userAddress={walletState.address}
            isSoloMode={true}
            onBackToLobby={() => setActiveTab('lobby')}
            onUpdateMatch={handleUpdateMatch}
            onResign={handleResign}
            onClaimTimeout={handleClaimTimeout}
          />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard onSelectPlayer={handleSelectPlayerProfile} />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            address={viewedProfileAddress || myAddress}
            onBack={() => setActiveTab('leaderboard')}
          />
        )}
      </main>

      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      <CreateMatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateMatch}
      />
    </div>
  );
}

export default App;
