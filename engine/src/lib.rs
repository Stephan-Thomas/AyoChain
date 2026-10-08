#![no_std]

extern crate alloc;

pub mod board;
pub mod rules;
pub mod types;

pub use board::{Board, HOUSES};
pub use rules::MoveError;
pub use types::{Config, GameState, Player};

#[cfg(test)]
mod tests;
