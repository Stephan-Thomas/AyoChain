# AyoChain Roadmap: 10 Contributor Issues

This document outlines 10 well-scoped issues ready for open-source contributors, categorized by difficulty label.

---

### Issue #1: [Good First Issue] Localization: Add Yoruba, Hausa, and Igbo Terminology
- **Difficulty**: `good-first-issue`
- **Component**: `frontend/src/locales`
- **Scope**:
  - Ayo originated across West Africa where distinct regional terminologies exist for pits, seeds, captures, and victory.
  - Implement an i18n localization dictionary providing translations for Yoruba (*Ayo Olopon*, *Ọmọ* / seeds, *Opon* / board), Hausa (*Dara* / board gaming terms), and Igbo.
  - Add a language dropdown picker in `Navbar.tsx`.
- **Acceptance Criteria**:
  - Switching language updates pit labels, action buttons, rules guide, and outcome modals.

---

### Issue #2: [Good First Issue] Soundscape Selector: Alternate Tactile Audio Themes
- **Difficulty**: `good-first-issue`
- **Component**: `frontend/src/services/audio.ts`
- **Scope**:
  - Expand the Web Audio synthesizer service to provide three selectable soundscapes:
    1. *Mahogany Wood* (Current warm hollow resonant clack)
    2. *Clay & Terracotta* (Dry earthy click)
    3. *Polished Cowrie Shells* (Bright porcelain clink)
  - Add an audio theme selector in the settings menu.
- **Acceptance Criteria**:
  - Synthesizer cleanly produces frequencies corresponding to the chosen physical medium without audio distortion.

---

### Issue #3: [Good First Issue] Light & Dark Mode Theme Switcher
- **Difficulty**: `good-first-issue`
- **Component**: `frontend/src/index.css`
- **Scope**:
  - Add an Akan terracotta daytime theme toggle switch.
  - Define CSS custom variables for light mode (`--wood-bg-light: #f6eedb`, `--wood-carved-light: #d4a373`) while maintaining high contrast and accessibility standards.
- **Acceptance Criteria**:
  - Passing WCAG AA color contrast ratio on all interactive buttons and seed counter badges.

---

### Issue #4: [Intermediate] Live Spectator Mode via Soroban Event Streaming
- **Difficulty**: `intermediate`
- **Component**: `frontend/src/components/GameView.tsx` & `contracts/match_contract`
- **Scope**:
  - Allow non-participant addresses to click "Spectate Match" in the Lobby and watch active matches unfold in real time.
  - Implement a polling/subscription loop to the Soroban RPC endpoint filtering for `symbol_short!("move")` events on the specific `match_id`.
  - Animate seed sowing moves on the spectator's board as transactions settle on ledger.
- **Acceptance Criteria**:
  - Spectators can watch games with read-only board access without wallet signing prompts.

---

### Issue #5: [Intermediate] Alternate Ruleset Engine Configuration (Ayo Olopon vs Abapa)
- **Difficulty**: `intermediate`
- **Component**: `engine/src/rules.rs` & `contracts/match_contract`
- **Scope**:
  - While Abapa requires 4 seeds per pit and counter-clockwise sowing, Nigerian *Ayo Olopon* features subtle variations in Kroo re-sowing and endgame sweeps.
  - Extend `engine::Config` with an enum `RulesetVariant::AyoOlopon` and `RulesetVariant::Abapa`.
  - Expose the ruleset selection in `create_match(stake, token, ruleset)`.
- **Acceptance Criteria**:
  - Comprehensive unit test suite validating that both rulesets execute with distinct invariant compliance.

---

### Issue #6: [Intermediate] WASM Binary Size Optimization & Gas Profiling
- **Difficulty**: `intermediate`
- **Component**: `contracts/`
- **Scope**:
  - Analyze and minimize the WASM binary sizes of `match_contract` and `rankings_contract`.
  - Integrate `wasm-opt -Oz` post-processing into cargo release pipeline.
  - Profile Soroban CPU instructions and RAM ledger footprints during 48-seed sowing loops.
- **Acceptance Criteria**:
  - Reduced WASM byte footprint by > 15% without impacting test execution.

---

### Issue #7: [Intermediate] Single-Elimination Tournament Bracket Escrow Contract
- **Difficulty**: `intermediate`
- **Component**: `contracts/tournament_contract`
- **Scope**:
  - Design a new tournament escrow contract facilitating 4-player or 8-player bracket championships.
  - Escrow entry wagers into a grand tournament prize pool (e.g. 70% 1st place, 30% 2nd place).
  - Automatically advance winners to the finals upon match completion.
- **Acceptance Criteria**:
  - Full Soroban unit tests simulating tournament rounds from quarterfinals to grand finals.

---

### Issue #8: [Advanced] WebAssembly Alpha-Beta Minimax AI Grandmaster
- **Difficulty**: `advanced`
- **Component**: `frontend/src/engine/ai.ts` & `engine`
- **Scope**:
  - Replace the greedy heuristic AI with a compiled Rust-WASM Alpha-Beta search engine (depth 6–8) running in a dedicated browser Web Worker.
  - Implement transposition tables with Zobrist hashing tailored for the 12-house Ayo board state.
  - Ensure zero main-thread UI jank during deep calculation.
- **Acceptance Criteria**:
  - Worker computes moves within 500ms and demonstrates tactical capture sacrifices.

---

### Issue #9: [Advanced] Multi-Token Wagering & SAC Integration (USDC on Stellar)
- **Difficulty**: `advanced`
- **Component**: `contracts/match_contract` & `frontend/src/components/Modals/CreateMatchModal.tsx`
- **Scope**:
  - Allow players to create challenges staked in Stellar USDC (`CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75`) or custom community tokens.
  - Validate SAC token contract addresses, fetch token metadata (symbol, decimals) via RPC, and format display amounts dynamically.
- **Acceptance Criteria**:
  - Tested with simulated USDC token contract; correctly transfers and disburses 6-decimal token amounts.

---

### Issue #10: [Advanced] Decentralized State Indexer with Mercury / Stellar Horizon
- **Difficulty**: `advanced`
- **Component**: `indexer/`
- **Scope**:
  - Build a lightweight indexing backend using Mercury or Stellar RPC event listeners.
  - Index match creations, moves, captured scores, timeouts, and Elo rating adjustments into an SQLite or PostgreSQL database.
  - Expose GraphQL or REST endpoints for instant global leaderboard queries and historical game replays.
- **Acceptance Criteria**:
  - Real-time ingestion of contract events with sub-2s latency from ledger closing.
