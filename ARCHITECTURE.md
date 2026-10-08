# AyoChain Rules Engine Architecture

The AyoChain Rules Engine is a pure Rust `no_std` crate that serves as the core logic for the on-chain Ayo / Oware game. 

## Design Philosophy

The engine is completely agnostic of Soroban or any blockchain environment. This ensures that the engine can be thoroughly unit tested, fuzzed, and audited independently of the smart contract logic.

The core data structures are lightweight, allowing the entire board state to fit neatly within smart contract storage later.

## State Representation
- **`Player`**: An enum `Player1` or `Player2`.
- **`Board`**: Represents the current game state, holding an array of 12 `u8` integers for the houses (pits), two `u8` integers for captured seed scores, the current turn, the overall `GameState` (InProgress, Won, Draw), and the rules `Config`.
- **`GameState`**: Encodes the outcome of the game.

## Core Mechanics & Interpretations (Abapa Rules)
The game follows the Abapa variation of Oware, played widely in West Africa. Ambiguous rules have been codified as follows:

1. **Sowing**: Counter-clockwise sowing. If 12 or more seeds are sown, the origin house is skipped (remains empty).
2. **Capturing**: A move ending on the opponent's side in a house with 2 or 3 seeds results in a capture. We proceed backwards (clockwise), continuing to capture as long as the previous house also belongs to the opponent and contains 2 or 3 seeds.
3. **Must Feed Rule**: If an opponent has no seeds, a player is obligated to play a move that gives the opponent seeds, if such a move exists. If multiple moves exist, any feeding move is legal.
4. **Grand Slam Rule (Void Capture)**: If a single move would capture *all* seeds on the opponent's side (a "Grand Slam"), the capture is voided. The seeds remain on the board, and the opponent plays next. This aligns with the principle that one must not starve the opponent if possible.
5. **Endgame**: 
   - A player wins immediately upon capturing 25 or more seeds.
   - If both players reach exactly 24 seeds, the game is a draw.
   - If a player's side is empty and it's their turn, but the opponent could not feed them on the previous turn, the opponent captures all remaining seeds on the board and the game ends (scores are then evaluated).
