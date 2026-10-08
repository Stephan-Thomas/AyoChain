#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Player {
    Player1,
    Player2,
}

impl Player {
    pub fn opponent(&self) -> Self {
        match self {
            Player::Player1 => Player::Player2,
            Player::Player2 => Player::Player1,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GameState {
    InProgress,
    Won(Player),
    Draw,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    /// If a capture would leave the opponent with 0 seeds, void the capture.
    pub void_grand_slam: bool,
    /// Player must play a move that feeds the opponent if the opponent has 0 seeds.
    pub must_feed: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            void_grand_slam: true,
            must_feed: true,
        }
    }
}
