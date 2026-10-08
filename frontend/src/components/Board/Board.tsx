import React from 'react';
import type { BoardState, Player } from '../../types/game';
import { Pit } from './Pit';
import { Store } from './Store';
import { getLegalMoves } from '../../engine/ayoRules';

interface BoardProps {
  board: BoardState;
  userRole?: Player | 'Spectator';
  isSoloMode?: boolean;
  recentlySownPits?: number[];
  recentlyCapturedPits?: number[];
  onPlayMove: (pitIndex: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  board,
  userRole = 'Player1',
  isSoloMode = false,
  recentlySownPits = [],
  recentlyCapturedPits = [],
  onPlayMove,
}) => {
  const legalMoves = getLegalMoves(board);
  const isP1Turn = board.current_turn === 'Player1';
  const isP2Turn = board.current_turn === 'Player2';

  // Determine if user can click:
  // In solo/practice mode, user can play either turn or user is P1
  const canP1Click = isSoloMode ? isP1Turn : userRole === 'Player1' && isP1Turn;
  const canP2Click = isSoloMode ? isP2Turn : userRole === 'Player2' && isP2Turn;

  // North pits displayed left-to-right: 11, 10, 9, 8, 7, 6 (circular counter-clockwise flow)
  const northPitIndices = [11, 10, 9, 8, 7, 6];
  // South pits displayed left-to-right: 0, 1, 2, 3, 4, 5
  const southPitIndices = [0, 1, 2, 3, 4, 5];

  return (
    <div className="ayo-board-container">
      {/* Wooden Carved Mancala Board Body */}
      <div className="ayo-board-carved">
        {/* West Store: Player 2 (North) */}
        <Store
          playerLabel="North (P2)"
          capturedCount={board.p2_captured}
          position="west"
          isLeader={board.p2_captured > board.p1_captured}
        />

        {/* Center Pits Section */}
        <div className="pits-center-grid">
          {/* North Row (Player 2: pits 11 -> 6) */}
          <div className="pit-row north-row">
            {northPitIndices.map((pitIdx) => (
              <Pit
                key={pitIdx}
                pitIndex={pitIdx}
                displayNumber={pitIdx - 5}
                seedCount={board.pits[pitIdx]}
                isLegal={legalMoves.includes(pitIdx)}
                isMySide={userRole === 'Player2'}
                isCurrentTurn={canP2Click}
                isRecentlySown={recentlySownPits.includes(pitIdx)}
                isRecentlyCaptured={recentlyCapturedPits.includes(pitIdx)}
                onSelect={onPlayMove}
              />
            ))}
          </div>

          {/* Sowing Direction Flow Indicator */}
          <div className="board-divider-channel">
            <div className="flow-track">
              <span className="flow-arrow flow-top">⟵ Counter-Clockwise Sowing ⟵</span>
              <div className="flow-crest" />
              <span className="flow-arrow flow-bottom">⟶ Counter-Clockwise Sowing ⟶</span>
            </div>
          </div>

          {/* South Row (Player 1: pits 0 -> 5) */}
          <div className="pit-row south-row">
            {southPitIndices.map((pitIdx) => (
              <Pit
                key={pitIdx}
                pitIndex={pitIdx}
                displayNumber={pitIdx + 1}
                seedCount={board.pits[pitIdx]}
                isLegal={legalMoves.includes(pitIdx)}
                isMySide={userRole === 'Player1'}
                isCurrentTurn={canP1Click}
                isRecentlySown={recentlySownPits.includes(pitIdx)}
                isRecentlyCaptured={recentlyCapturedPits.includes(pitIdx)}
                onSelect={onPlayMove}
              />
            ))}
          </div>
        </div>

        {/* East Store: Player 1 (South) */}
        <Store
          playerLabel="South (P1)"
          capturedCount={board.p1_captured}
          position="east"
          isLeader={board.p1_captured > board.p2_captured}
        />
      </div>
    </div>
  );
};
