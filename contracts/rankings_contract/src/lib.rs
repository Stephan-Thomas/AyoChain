#![no_std]

mod types;
mod elo;
pub mod contract;

#[cfg(test)]
mod test;

pub use contract::{RankingsContract, RankingsContractClient};
pub use types::{DataKey, MatchOutcome, PlayerStats, LeaderboardEntry};
