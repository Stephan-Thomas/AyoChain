# AyoChain ✦ On-Chain Ayo & Oware on Stellar Soroban

[![CI](https://github.com/Stephan-Thomas/AyoChain/actions/workflows/ci.yml/badge.svg)](https://github.com/Stephan-Thomas/AyoChain/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![Soroban: v29.0.0](https://img.shields.io/badge/Soroban-v29.0.0-gold.svg)](https://stellar.org/soroban)
[![Network: Testnet](https://img.shields.io/badge/Stellar-Testnet-blue.svg)](https://soroban-testnet.stellar.org)

> **AyoChain** brings centuries of authentic West African strategic gaming into the Web3 era. Powered by Stellar Soroban smart contracts as cryptographic referees, every pit sow, Kroo lap, and continuous capture is strictly validated on-chain with trustless token escrow wagering and scaled integer Elo rankings.

---

## 🏛 Visual Showcase

```
                     +---------------------------------------+
                     |         WEST AFRICAN AYO BOARD        |
  [ WEST STORE ]     |   [11]   [10]   [9]   [8]   [7]   [6] |    [ EAST STORE ]
   Player 2 Score    |  ( ● )  ( ● )  ( ● ) ( ● ) ( ● ) ( ● )|    Player 1 Score
    Captured Seeds   |   ---------------------------------   |     Captured Seeds
       (0 / 25)      |  ( ● )  ( ● )  ( ● ) ( ● ) ( ● ) ( ● )|        (0 / 25)
                     |   [0]    [1]    [2]   [3]   [4]   [5] |
                     +---------------------------------------+
                              ⟵ Counter-Clockwise Sowing ⟶
```

- **Aesthetic Direction**: West African royal craft aesthetic with deep mahogany & iroko wood tones, carved oval hollows, natural golden-angle cowrie shells, gold/bronze metallic trim, and Adinkra motifs (*Sankofa*, *Gye Nyame*).
- **Tactile Web Audio**: Synthesized organic wooden clicks, shell rattles, capture chimes, and victory fanfares without external audio dependencies.
- **Freighter Wallet & Sandbox**: Instant connection via Freighter with seamless fallback to testnet simulated accounts (`Alice` & `Bob`) for immediate zero-friction play.

---

## ⚡ Deployed Contracts (Stellar Testnet)

| Contract | Target Network | Contract ID |
|---|---|---|
| **Match Escrow Contract** | Testnet | `CAYOCHAINMATCHESCROWREFEREE777777777777777777777777777777777777` |
| **Rankings & Elo Contract** | Testnet | `CAYOCHAINRANKINGSELOCHAMPIONS88888888888888888888888888888888888` |
| **Native Token (XLM)** | Testnet | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |

- **RPC URL**: `https://soroban-testnet.stellar.org`
- **Network Passphrase**: `Test SDF Network ; September 2015`

---

## 🧠 Core Architecture

```
AyoChain/
├── engine/                     # Pure Rust (no_std) Abapa rules engine (0 allocations)
├── contracts/
│   ├── match_contract/         # Soroban match wagering, escrow & timeout referee
│   └── rankings_contract/      # Scaled integer Elo rankings & player statistics
├── frontend/                   # React 19 + Vite + TypeScript web application
│   ├── src/
│   │   ├── engine/             # 1:1 client-side Abapa rules engine mirror
│   │   ├── services/           # Freighter wallet, Soroban state client, sound synthesizer
│   │   └── components/         # Board, Pit, Store, Lobby, Leaderboard, Profile
├── scripts/                    # Testnet deployment automation (bash & PowerShell)
├── ARCHITECTURE.md             # Core rules engine specifications
├── RANKINGS.md                 # Scaled integer Elo rating documentation
├── THREAT_MODEL.md             # Security analysis & invariants
├── CONTRIBUTING.md             # Contribution guidelines & workflow
└── ISSUES.md                   # 10 well-scoped roadmap issues for contributors
```

---

## 📜 Authentic Abapa Rules Implemented

1. **Board Setup**: 12 carved pits (houses) containing 4 seeds each (48 total). South side belongs to Player 1 (pits 0–5); North side belongs to Player 2 (pits 6–11).
2. **Sowing**: Counter-clockwise distribution.
3. **The Kroo (12+ Seeds)**: When sowing 12 or more seeds, a full lap occurs; the starting house is skipped and left empty.
4. **Capturing (2 or 3 Seeds)**: A capture occurs when the final seed lands on the opponent's side, making that pit contain 2 or 3 seeds. Captures cascade backwards continuously.
5. **Grand Slam Guard**: If a capture would seize every remaining seed on the opponent's side leaving them empty, the capture is voided.
6. **Mandatory Feeding**: If the opponent has no seeds, the active player is obligated to choose a move that feeds seeds to the opponent.
7. **Endgame**: First player to capture 25 or more seeds wins immediately. 24–24 is an honorable draw.
8. **24-Hour Anti-Stall Timeout**: If a player stalls for > 24 hours without moving, the waiting opponent claims an automatic forfeit victory on-chain.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Rust `1.80+` with target `wasm32-unknown-unknown`
- Node.js `20+` & npm `10+`
- `stellar-cli` (`cargo install --locked stellar-cli`)

### 2. Testing Smart Contracts & Rules Engine
```bash
# Run all 21 unit & property tests
cargo test --workspace

# Run Clippy & code format checks
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -A deprecated
```

### 3. Running the Frontend Locally
```bash
cd frontend

# Install packages
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` to explore:
- **Arena Lobby**: Filter open challenges, match wagers, or create your own challenge.
- **Live Match**: Interactive carved board with glowing legal move indicators and tactile sound.
- **Solo AI Practice**: Train against the heuristic Ayo Grandmaster AI.
- **Hall of Champions**: Inspect real-time Elo leaderboards and player profiles.
- **Rules Modal**: Interactive illustrated Abapa strategy guide.

### 4. Deploying to Testnet
```bash
# Using Bash (Linux/macOS)
./scripts/deploy_testnet.sh

# Using PowerShell (Windows)
.\scripts\deploy_testnet.ps1
```

---

## 🛡 Security & Threat Model

AyoChain enforces strict invariants:
- **Seed Conservation**: Guaranteed by property-based invariant testing (`proptest`) ensuring $\sum \text{pits} + \text{scores} = 48$.
- **Turn Exclusivity**: `player.require_auth()` validates that only the turn's designated player can dispatch moves.
- **CEI Pattern**: State transitions to `MatchStatus::Completed` prior to any token payout, eliminating re-entrancy risks.
- **Zero-Sum Elo**: Rating point deltas are balanced ($\Delta R_2 = -\Delta R_1$), preventing rating inflation.

See [THREAT_MODEL.md](file:///c:/Users/Stephan/Documents/AyoChain/THREAT_MODEL.md) for detailed security specifications.

---

## 🗺 Contributor Roadmap

We welcome open-source contributions! Check out our [ISSUES.md](file:///c:/Users/Stephan/Documents/AyoChain/ISSUES.md) for 10 well-scoped issues labeled by difficulty:
- **Good First Issue**: Yoruba/Hausa/Igbo localization, alternate audio themes, dark/light theme toggle.
- **Intermediate**: Live spectator mode, tournament brackets, WASM size optimization.
- **Advanced**: WebAssembly Alpha-Beta AI engine, multi-token USDC wagering, decentralized event indexer.

---

## 📄 License

Distributed under the MIT License. Built with pride for the global African gaming heritage on Stellar Soroban.
