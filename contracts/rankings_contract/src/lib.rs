#![no_std]

pub mod contract;
mod elo;
mod types;

#[cfg(test)]
mod test;

pub use contract::{RankingsContract, RankingsContractClient};
pub use types::{DataKey, LeaderboardEntry, MatchOutcome, PlayerStats};
