# Contributing to AyoChain

Thank you for your interest in contributing to **AyoChain**! AyoChain brings centuries of West African cultural gaming tradition onto the decentralized, high-speed Stellar Soroban ecosystem.

Whether you're optimizing gas in the Rust rules engine, building animated UI components, or adding translations for Yoruba, Hausa, or Igbo, your contributions are welcome.

---

## 1. Development Prerequisites

Ensure you have the following toolchains installed:

- **Rust**: `v1.80.0` or later with the WebAssembly target:
  ```bash
  rustup target add wasm32-unknown-unknown
  rustup component add rustfmt clippy
  ```
- **Node.js**: `v20.x` or `v22.x` and `npm v10+`
- **Stellar CLI**:
  ```bash
  cargo install --locked stellar-cli
  ```
- **Freighter Wallet**: Available for Chrome, Firefox, and Brave via [freighter.app](https://www.freighter.app).

---

## 2. Repository Layout

```
AyoChain/
├── engine/                     # Pure Rust (no_std) Abapa Ayo/Oware rules engine
├── contracts/
│   ├── match_contract/         # Soroban match wagering & escrow referee contract
│   └── rankings_contract/      # Soroban Elo rankings & player stats contract
├── frontend/                   # React 19 + Vite + TypeScript web application
│   ├── src/
│   │   ├── engine/             # 1:1 client-side Abapa rules engine mirror
│   │   ├── services/           # Freighter wallet, Soroban client, audio synthesizer
│   │   └── components/         # Carved wood board, Lobby, Profile, Leaderboard
├── scripts/                    # Testnet deployment automation (bash & PowerShell)
├── ARCHITECTURE.md             # Core rules engine specifications
├── RANKINGS.md                 # Scaled integer Elo rating documentation
└── THREAT_MODEL.md             # Security analysis & invariants
```

---

## 3. Local Development Workflow

### Building and Testing Smart Contracts

```bash
# Run all workspace tests (engine, match_contract, rankings_contract)
cargo test --workspace

# Check formatting and linting
cargo fmt --all -- --check
cargo clippy --workspace --all-targets

# Compile release WASM bytecode
cargo build --target wasm32-unknown-unknown --release -p match_contract -p rankings_contract
```

### Developing the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run Vite development server (with HMR)
npm run dev

# Run frontend tests
npm test

# Run oxlint linter
npm run lint

# Verify production build
npm run build
```

---

## 4. Git & Commit Guidelines

AyoChain strictly follows **Conventional Commits**:
- `feat:` for new features or capabilities
- `fix:` for bug fixes
- `test:` for test additions or improvements
- `docs:` for documentation updates
- `chore:` for dependency updates or build tooling

Branches should be named descriptively:
- `feature/<feature-name>`
- `fix/<bug-description>`
- `phase-<N>-<topic>`

---

## 5. Submitting Pull Requests

1. Fork the repository and create your feature branch from `main`.
2. Ensure all tests pass (`cargo test` and `npm test`).
3. Ensure linters pass (`cargo fmt`, `oxlint`).
4. Commit your changes using conventional commit messages.
5. Open a Pull Request with a clear description of your changes and any relevant issue references.
