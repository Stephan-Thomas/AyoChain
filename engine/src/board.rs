use crate::types::{Config, GameState, Player};

pub const HOUSES: usize = 12;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Board {
    pub houses: [u8; HOUSES],
    pub p1_score: u8,
    pub p2_score: u8,
    pub current_turn: Player,
    pub state: GameState,
    pub config: Config,
}

impl Default for Board {
    fn default() -> Self {
        Self::new(Config::default())
    }
}

impl Board {
    pub fn new(config: Config) -> Self {
        Self {
            houses: [4; HOUSES],
            p1_score: 0,
            p2_score: 0,
            current_turn: Player::Player1,
            state: GameState::InProgress,
            config,
        }
    }

    pub fn player_houses(player: Player) -> core::ops::Range<usize> {
        match player {
            Player::Player1 => 0..6,
            Player::Player2 => 6..12,
        }
    }

    pub fn is_owner(player: Player, house: usize) -> bool {
        match player {
            Player::Player1 => house < 6,
            Player::Player2 => (6..12).contains(&house),
        }
    }

    pub fn score_mut(&mut self, player: Player) -> &mut u8 {
        match player {
            Player::Player1 => &mut self.p1_score,
            Player::Player2 => &mut self.p2_score,
        }
    }

    pub fn score(&self, player: Player) -> u8 {
        match player {
            Player::Player1 => self.p1_score,
            Player::Player2 => self.p2_score,
        }
    }

    pub fn total_seeds_on_side(&self, player: Player) -> u8 {
        Self::player_houses(player).map(|i| self.houses[i]).sum()
    }
}
