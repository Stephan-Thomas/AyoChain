# AyoChain Security Architecture & Threat Model

AyoChain implements an on-chain referee and wagering system for the traditional West African board game Ayo/Oware (Abapa rules) on Stellar Soroban. This document details the threat model, trust boundaries, attack vectors, and implemented mitigations.

---

## 1. System Overview & Trust Boundaries

```
       +-----------------------+              +------------------------+
       |   Player 1 (Alice)    |              |    Player 2 (Bob)      |
       +-----------+-----------+              +------------+-----------+
                   |                                       |
                   | Signed Tx (Freighter)                 | Signed Tx (Freighter)
                   v                                       v
       +---------------------------------------------------------------+
       |                   Stellar Soroban Runtime                     |
       |  +---------------------------------------------------------+  |
       |  |                   Match Contract                        |  |
       |  |  - Escrows tokens via Stellar Asset Contract            |  |
       |  |  - Invokes pure no_std Rules Engine                     |  |
       |  |  - Enforces turns & 24h anti-stall timeout              |  |
       |  +----------------------------+----------------------------+  |
       |                               | Auth Record                   |
       |                               v                               |
       |  +---------------------------------------------------------+  |
       |  |                  Rankings Contract                      |  |
       |  |  - Scaled integer Elo computation                       |  |
       |  |  - Tracks wins, losses, streaks, and earnings           |  |
       |  +---------------------------------------------------------+  |
       +---------------------------------------------------------------+
```

### Trust Assumptions
- **Stellar Network & Soroban VM**: Relies on consensus finality, ledger timestamp monotonicity, and cryptographic transaction signing (`ed25519`).
- **Standard Token Contracts**: Assumes the token contract implements the Soroban SAC / SEP-41 token interface (`transfer`, `balance`).
- **Client Environments**: Frontends and wallet extensions run in untrusted user environments. No client-side calculation is trusted by the smart contract.

---

## 2. Assets & Protected Resources

1. **Escrowed Token Stakes**: Funds deposited by Player 1 and Player 2 for each match.
2. **Game State Integrity**: Pit seed counts, captured tallies, active turn indicator, and match status.
3. **Player Elo Ratings & Leaderboard**: Verifiable ratings and performance history.

---

## 3. Threat Analysis & Mitigations

### 3.1 Frontrunning, Griefing & Turn Hijacking
- **Threat**: An attacker observes a pending move in the transaction pool and attempts to frontrun it or submit moves on behalf of another player.
- **Mitigation**:
  - `play_move` strictly invokes `player.require_auth()`, where `player` is cryptographically validated to be the current turn's player (`match.board.current_turn`).
  - Any transaction signed by an unauthorized key or submitted out-of-turn immediately panics with `"Not player's turn"`.

### 3.2 Escrow Drain & Double Payout
- **Threat**: A malicious participant attempts to invoke withdrawal or claim routines repeatedly to drain the contract's token balance.
- **Mitigation**:
  - Checks-Effects-Interactions (CEI) pattern is enforced.
  - The match status is atomically transitioned to `MatchStatus::Completed` **before** token payouts are executed.
  - Payout helper `execute_payout` sets the winner and status in storage before transferring tokens. Any re-entrant call fails the `match.status == MatchStatus::Active` check.

### 3.3 Player Abandonment & Stalling (Denial of Service)
- **Threat**: A losing player refuses to submit their next move, locking the opponent's escrowed deposit indefinitely.
- **Mitigation**:
  - **On-Chain 24-Hour Timeout**: Every move updates `last_move_timestamp = env.ledger().timestamp()`.
  - If 24 hours (86,400 seconds) elapse without a move, the waiting opponent can invoke `claim_timeout(match_id)`.
  - The stalling player automatically forfeits, the opponent is declared winner, and the full escrowed pot is awarded to the opponent.

### 3.4 Unmatched Challenges & Creator Lockup
- **Threat**: A player creates a wager challenge, but no opponent ever joins.
- **Mitigation**:
  - Match creator can call `cancel_match(match_id)` anytime while `match.status == MatchStatus::Pending`.
  - The contract verifies `creator.require_auth()` and refunds 100% of the staked tokens to the creator.

### 3.5 Illegal Board Moves & Rule Violations
- **Threat**: A player attempts an invalid Abapa move (sowing backwards, playing empty pits, playing opponent pits, illegal starvation/grand-slam captures).
- **Mitigation**:
  - The smart contract embeds the pure Rust `engine` crate. Every move is evaluated by `board.step(house)`.
  - If the chosen pit is illegal or violates feeding rules, `engine` returns `Err(RulesError)` and the transaction reverts.

### 3.6 Rating Manipulation & Unauthorized Elo Writes
- **Threat**: An attacker invokes `record_match_result` on `rankings_contract` directly to inflate their Elo or fabricate wins.
- **Mitigation**:
  - `record_match_result` enforces `caller.require_auth()`.
  - The contract strictly verifies that `caller == admin` OR `caller == match_contract`.
  - Arbitrary third-party calls panic with `"Unauthorized caller"`.

### 3.7 Arithmetic Overflows & Underflows
- **Threat**: Extreme token stake amounts or repeated wins trigger integer wraps.
- **Mitigation**:
  - Token stakes and earnings utilize `i128`.
  - Seed tallies utilize bounded `u8` (total seeds on board invariant: 48).
  - Elo calculation uses clamped rating differentials (`diff ∈ [-400, 400]`) with floor limits (`rating ≥ 100`).

---

## 4. Invariant Checklist

| Invariant | Description | Verification Method |
|---|---|---|
| **Conservation of Seeds** | Sum of all pits and captured stores must always equal exactly 48. | Verified by property tests (`proptest`) in `engine`. |
| **Escrow Solvency** | Contract holds exactly $\sum \text{wagers}$ for active/pending matches. | Verified in `match_contract` unit tests. |
| **Turn Exclusivity** | Only the authenticated address matching `current_turn` can advance game state. | Enforced by `require_auth` in `contract.rs`. |
| **Zero-Sum Elo** | Rating delta gained by winner strictly equals rating delta lost by loser. | Enforced in `elo.rs` ($\Delta R_2 = -\Delta R_1$). |
| **Finality** | A match in `Completed` or `Cancelled` status cannot be modified or re-claimed. | Enforced by status guard assertions. |
