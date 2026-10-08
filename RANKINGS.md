# AyoChain Rankings & Elo Architecture

The `rankings_contract` provides on-chain Elo rating tracking, win/loss history, streaks, and token earnings for players participating in AyoChain matches on Stellar Soroban.

---

## 1. Design & Objectives

1. **Deterministic On-Chain Elo**: 
   Standard Elo algorithms rely on floating-point arithmetic ($1 / (1 + 10^{(R_2 - R_1)/400})$). Because Soroban smart contracts run in a deterministic, `no_std` WebAssembly environment without native floating-point math, our contract employs a **scaled integer Elo algorithm** with a scale factor of 1,000.

2. **Zero-Sum Rating Updates**:
   To prevent rating inflation while rewarding underdogs, rating points gained by the winner equal the points deducted from the loser ($\Delta R_1 = -\Delta R_2$).

3. **Dynamic K-Factor**:
   - **Provisional/New Players (< 10 matches)**: $K = 40$ for accelerated placement.
   - **Established Masters (≥ 10 matches)**: $K = 24$ for rating stability.

4. **Leaderboard Indexing**:
   The contract maintains an on-chain cache of the top-ranked warriors, sorted descending by Elo rating for immediate retrieval by frontends and RPC indexers.

---

## 2. Elo Algorithm Formulation

Given Player 1 rating $R_1$ and Player 2 rating $R_2$:

1. **Clamped Rating Differential**:
   $$\text{diff} = \text{clamp}(R_1 - R_2, -400, 400)$$

2. **Expected Score ($E_1$) in thousandths (0 to 1000)**:
   $$E_1 = 500 + \frac{\text{diff} \times 5}{4}$$

3. **Actual Score ($S_1$)**:
   - Win: $S_1 = 1000$
   - Draw: $S_1 = 500$
   - Loss: $S_1 = 0$

4. **Rating Adjustment**:
   $$\Delta R_1 = \frac{K \times (S_1 - E_1)}{1000}$$
   $$R_1' = \max(100, R_1 + \Delta R_1)$$
   $$R_2' = \max(100, R_2 - \Delta R_1)$$

---

## 3. Master Rank Tiers

Players are assigned honorific titles inspired by traditional West African Oware championships:

| Elo Rating Range | Master Rank Title | Adinkra Motif / Symbol |
|---|---|---|
| `< 1100` | **Oware Initiate** | Seedling (*Nyame Nti*) |
| `1100 – 1299` | **Village Challenger** | Twin Horns (*Akoben*) |
| `1300 – 1499` | **Royal Elder** | Staff of Authority (*Okoye*) |
| `1500+` | **Ayo Grandmaster** | Supremacy (*Gye Nyame*) |

---

## 4. Contract API

### Write Methods

- `initialize(admin: Address)`:
  Initializes the contract and sets the administrator.

- `set_match_contract(match_contract: Address)`:
  Authorizes the `match_contract` to record outcomes directly upon match settlement. Requires admin authorization.

- `record_match_result(caller: Address, player1: Address, player2: Address, outcome: MatchOutcome, wager: i128)`:
  Authenticates that `caller` is either the admin or authorized match contract. Computes Elo delta, increments matches played, updates win/loss/draw counters, records streaks, updates token earnings, and updates the leaderboard cache. Emits event `elo_upd`.

### Read Methods

- `get_player_stats(player: Address) -> PlayerStats`:
  Returns `{ rating, matches_played, wins, losses, draws, earnings, current_streak, best_streak }`. Defaults to 1200 rating with 0 matches if unranked.

- `get_leaderboard(limit: u32) -> Vec<LeaderboardEntry>`:
  Returns the top players sorted by Elo rating.
