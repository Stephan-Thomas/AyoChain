# AyoChain

AyoChain is a fully on-chain implementation of the Ayo/Oware game (Abapa rules) built on Stellar Soroban.

## Phase 1: Rules Engine

The repository currently contains the rules engine in the `engine` directory. The engine is a pure Rust, `no_std` crate containing the state representation and game rules logic. It performs no allocations and is perfectly suited for on-chain execution within a Soroban smart contract.

### Features
- Complete Abapa ruleset implementation.
- Counter-clockwise sowing.
- Backwards capturing on 2 or 3 seeds.
- Grand slam voiding (configurable).
- Must-feed rule enforcement (configurable).
- Automated endgame resolution.

### Testing
To test the rules engine, navigate to the `engine` directory and run:
```sh
cargo test
```
The test suite includes extensive unit tests for edge cases (e.g., 12+ seed skipping, must-feed violations) as well as property-based testing (proptest) to guarantee game invariants like seed conservation.
