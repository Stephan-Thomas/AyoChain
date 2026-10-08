import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Flame,
  Flag,
  Hourglass,
  Bot,
  User,
  CheckCircle,
} from 'lucide-react';
import type { MatchInfo, BoardState, Player } from '../types/game';
import { Board } from './Board/Board';
import { GameOverModal } from './Modals/GameOverModal';
import { executeMove, getBestAIMove } from '../engine/ayoRules';
import { sound } from '../services/audio';

interface GameViewProps {
  match: MatchInfo;
  userAddress: string | null;
  isSoloMode?: boolean;
  onBackToLobby: () => void;
  onUpdateMatch: (updated: MatchInfo) => void;
  onResign: (matchId: string, player: Player) => void;
  onClaimTimeout: (matchId: string) => void;
}

export const GameView: React.FC<GameViewProps> = ({
  match,
  userAddress,
  isSoloMode = false,
  onBackToLobby,
  onUpdateMatch,
  onResign,
  onClaimTimeout,
}) => {
  const [board, setBoard] = useState<BoardState>(match.board);
  const [recentlySown, setRecentlySown] = useState<number[]>([]);
  const [recentlyCaptured, setRecentlyCaptured] = useState<number[]>([]);
  const [logs, setLogs] = useState<string[]>([
    'Match initialized with standard 48 seeds (4 per pit). Abapa rules enforced.',
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  // Sync board with match prop if changed
  useEffect(() => {
    setBoard(match.board);
  }, [match]);

  const userRole: Player | 'Spectator' = isSoloMode
    ? 'Player1'
    : userAddress && match.creator.toLowerCase() === userAddress.toLowerCase()
    ? 'Player1'
    : userAddress && match.opponent?.toLowerCase() === userAddress.toLowerCase()
    ? 'Player2'
    : 'Spectator';

  // Handle human move
  const handlePlayMove = (pitIndex: number) => {
    if (board.is_game_over || isAiThinking) return;

    try {
      sound.playSeedClack();
      const result = executeMove(board, pitIndex);

      setRecentlySown(result.sownPath);
      setRecentlyCaptured(result.capturedPits);

      if (result.capturedCount > 0) {
        sound.playCaptureChime(result.capturedCount);
      }

      const playerLabel = board.current_turn === 'Player1' ? 'South (P1)' : 'North (P2)';
      const pitDisplay = pitIndex <= 5 ? pitIndex + 1 : pitIndex - 5;
      const captureLog =
        result.capturedCount > 0
          ? ` [Captured ${result.capturedCount} seeds!]`
          : '';
      const newLog = `${playerLabel} played Pit ${pitDisplay}.${captureLog}`;

      setLogs((prev) => [newLog, ...prev.slice(0, 7)]);
      setBoard(result.newBoard);

      const updatedMatch: MatchInfo = {
        ...match,
        board: result.newBoard,
        currentTurn: result.newBoard.current_turn,
        status: result.newBoard.is_game_over ? 'Completed' : 'Active',
        winner: result.newBoard.winner,
        lastMoveTimestamp: Date.now(),
      };
      onUpdateMatch(updatedMatch);

      // In Solo AI mode, trigger AI move if it's Player2's turn
      if (isSoloMode && !result.newBoard.is_game_over && result.newBoard.current_turn === 'Player2') {
        triggerAiMove(result.newBoard, updatedMatch);
      }
    } catch (err: unknown) {
      console.error(err);
      sound.playThud();
    }
  };

  // Heuristic AI response
  const triggerAiMove = (currentBoard: BoardState, currentMatch: MatchInfo) => {
    setIsAiThinking(true);
    setTimeout(() => {
      try {
        const aiMove = getBestAIMove(currentBoard);
        if (aiMove !== -1) {
          sound.playSeedClack(1.15);
          const aiResult = executeMove(currentBoard, aiMove);

          setRecentlySown(aiResult.sownPath);
          setRecentlyCaptured(aiResult.capturedPits);

          if (aiResult.capturedCount > 0) {
            sound.playCaptureChime(aiResult.capturedCount);
          }

          const pitDisplay = aiMove - 5;
          const captureLog =
            aiResult.capturedCount > 0
              ? ` [Captured ${aiResult.capturedCount} seeds!]`
              : '';
          const aiLog = `Ayo Grandmaster played Pit ${pitDisplay}.${captureLog}`;

          setLogs((prev) => [aiLog, ...prev.slice(0, 7)]);
          setBoard(aiResult.newBoard);

          const aiUpdatedMatch: MatchInfo = {
            ...currentMatch,
            board: aiResult.newBoard,
            currentTurn: aiResult.newBoard.current_turn,
            status: aiResult.newBoard.is_game_over ? 'Completed' : 'Active',
            winner: aiResult.newBoard.winner,
            lastMoveTimestamp: Date.now(),
          };
          onUpdateMatch(aiUpdatedMatch);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsAiThinking(false);
      }
    }, 750); // Natural thinking delay
  };

  const handleRematch = () => {
    // Reset board
    const initial = {
      pits: Array(12).fill(4),
      p1_captured: 0,
      p2_captured: 0,
      current_turn: 'Player1' as Player,
      is_game_over: false,
      winner: 'None' as const,
    };
    setBoard(initial);
    setRecentlySown([]);
    setRecentlyCaptured([]);
    const resetMatch: MatchInfo = {
      ...match,
      board: initial,
      currentTurn: 'Player1',
      status: 'Active',
      winner: 'None',
      lastMoveTimestamp: Date.now(),
    };
    onUpdateMatch(resetMatch);
  };

  const potNumber = parseFloat(match.wagerAmount.replace(/[^\d.]/g, '')) * 2;
  const potDisplay = isNaN(potNumber) ? match.wagerAmount : `${potNumber} XLM`;

  const truncate = (s?: string) => (s ? `${s.slice(0, 6)}...${s.slice(-4)}` : 'Waiting...');

  return (
    <div className="game-view-container">
      {/* Top Match HUD Bar */}
      <div className="game-hud-bar glass-panel">
        <div className="hud-left">
          <button className="back-link-btn" onClick={onBackToLobby}>
            <ArrowLeft size={16} />
            <span>Arena Lobby</span>
          </button>
          <span className="match-tag-id">Match #{match.id.replace('match-', '')}</span>
        </div>

        <div className="hud-center">
          <div className="wager-pot-pill">
            <Flame size={16} className="pot-flame" />
            <span className="pot-txt">Escrow Pot: <strong>{potDisplay}</strong></span>
          </div>

          <div className={`turn-indicator-pill turn-${board.current_turn.toLowerCase()}`}>
            <span className="turn-pulse-dot" />
            <span>
              {board.is_game_over
                ? 'Match Concluded'
                : isAiThinking
                ? 'Ayo Grandmaster is calculating...'
                : board.current_turn === 'Player1'
                ? 'South (P1) Turn'
                : 'North (P2) Turn'}
            </span>
          </div>
        </div>

        <div className="hud-right">
          {!board.is_game_over && !isSoloMode && (
            <>
              <button
                className="hud-action-btn btn-warn"
                onClick={() => setShowResignConfirm(true)}
                title="Resign and forfeit wager"
              >
                <Flag size={14} />
                <span>Resign</span>
              </button>
              <button
                className="hud-action-btn"
                onClick={() => onClaimTimeout(match.id)}
                title="Claim victory if opponent has stalled over 24 hours"
              >
                <Hourglass size={14} />
                <span>Claim Timeout</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Players Header */}
      <div className="players-hud-grid">
        {/* North Player (Player 2) */}
        <div className={`player-card-hud glass-panel ${board.current_turn === 'Player2' ? 'active-turn' : ''}`}>
          <div className="player-avatar-crest crest-north">
            {isSoloMode ? <Bot size={22} /> : <User size={22} />}
          </div>
          <div className="player-hud-info">
            <span className="player-role-tag">North Player (P2)</span>
            <span className="player-hud-address">
              {isSoloMode ? 'Ayo Grandmaster AI' : truncate(match.opponent)}
            </span>
          </div>
          <div className="player-hud-captured">
            <span className="captured-val">{board.p2_captured}</span>
            <span className="captured-sub">/ 25 to win</span>
          </div>
        </div>

        {/* South Player (Player 1) */}
        <div className={`player-card-hud glass-panel ${board.current_turn === 'Player1' ? 'active-turn' : ''}`}>
          <div className="player-avatar-crest crest-south">
            <User size={22} />
          </div>
          <div className="player-hud-info">
            <span className="player-role-tag">South Player (P1)</span>
            <span className="player-hud-address">
              {isSoloMode ? 'You (Challenger)' : truncate(match.creator)}
            </span>
          </div>
          <div className="player-hud-captured">
            <span className="captured-val">{board.p1_captured}</span>
            <span className="captured-sub">/ 25 to win</span>
          </div>
        </div>
      </div>

      {/* Main Board Arena */}
      <div className="board-stage-wrapper">
        <Board
          board={board}
          userRole={userRole}
          isSoloMode={isSoloMode}
          recentlySownPits={recentlySown}
          recentlyCapturedPits={recentlyCaptured}
          onPlayMove={handlePlayMove}
        />
      </div>

      {/* Referee Log Ticker */}
      <div className="referee-log-bar glass-panel">
        <div className="log-badge">
          <CheckCircle size={14} />
          <span>Soroban Referee Log:</span>
        </div>
        <div className="log-messages-stream">
          {logs.map((log, index) => (
            <span key={index} className={`log-entry ${index === 0 ? 'log-latest' : ''}`}>
              {log}
            </span>
          ))}
        </div>
      </div>

      {/* Resign Confirm Dialog */}
      {showResignConfirm && (
        <div className="modal-overlay">
          <div className="modal-dialog glass-panel">
            <h3 className="modal-title">Confirm Resignation</h3>
            <p className="form-description">
              Are you sure you want to forfeit this match? Your escrowed wager will be immediately awarded to your opponent.
            </p>
            <div className="modal-footer">
              <button
                className="secondary-action-btn"
                onClick={() => setShowResignConfirm(false)}
              >
                Continue Playing
              </button>
              <button
                className="primary-action-btn btn-danger-action"
                onClick={() => {
                  setShowResignConfirm(false);
                  onResign(match.id, userRole === 'Player2' ? 'Player2' : 'Player1');
                }}
              >
                Confirm Forfeit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={board.is_game_over}
        winner={board.winner}
        board={board}
        wagerAmount={match.wagerAmount}
        isSoloMode={isSoloMode}
        onRematch={handleRematch}
        onReturnLobby={onBackToLobby}
      />
    </div>
  );
};
