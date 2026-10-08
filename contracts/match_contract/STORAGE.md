# Storage Design

The smart contract uses Soroban's persistent storage for match state to ensure active and completed match histories are maintained safely.

## Data Keys

`DataKey` enum maps exactly to the keys stored in Soroban.
```rust
#[contracttype]
pub enum DataKey {
    MatchCount,        // u64 - tracks the total number of matches created, used for assigning new IDs
    Match(u64),        // Map from match ID to MatchState
}
```

## State Structures

### `MatchState`
```rust
#[contracttype]
pub struct MatchState {
    pub id: u64,
    pub p1: Address,           // Creator of the match
    pub p2: Option<Address>,   // Joiner, initialized as None
    pub token: Address,        // Token used for stake
    pub stake: i128,           // Amount each player wagers (Total Pot = 2x stake)
    pub status: MatchStatus,   // WaitingForPlayer2 | InProgress | FinishedWon | FinishedDraw | Cancelled
    pub board: ContractBoard,  // The on-chain representation of the Ayo board
}
```

### `ContractBoard`
Because the core rules engine is a pure Rust `no_std` crate that does not depend on the Soroban SDK (ensuring it remains portable and easily testable), we maintain a Soroban-compatible wrapper struct in the contract layer:

```rust
#[contracttype]
pub struct ContractBoard {
    pub houses: BytesN<12>,         // 12 houses on the board
    pub p1_score: u32,              // Player 1 captured seeds
    pub p2_score: u32,              // Player 2 captured seeds
    pub current_turn_is_p1: bool,   // Turn tracking
    pub must_feed: bool,            // Config rules snapshot
    pub void_grand_slam: bool,      // Config rules snapshot
}
```
`ContractBoard` provides conversion functions to and from `engine::Board`. When a move is executed, the contract deserializes the board into an `engine::Board`, performs validation and rules execution using the engine, and then serializes the mutated board back to `ContractBoard` before saving to persistent storage.
