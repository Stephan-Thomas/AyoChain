use crate::board::{Board, HOUSES};
use crate::types::{GameState, Player};

#[derive(Debug, PartialEq, Eq)]
pub enum MoveError {
    GameAlreadyOver,
    InvalidHouse,
    EmptyHouse,
    MustFeedOpponent,
}

impl Board {
    pub fn play_move(&mut self, house: usize) -> Result<(), MoveError> {
        if self.state != GameState::InProgress {
            return Err(MoveError::GameAlreadyOver);
        }
        if !Self::is_owner(self.current_turn, house) {
            return Err(MoveError::InvalidHouse);
        }
        if self.houses[house] == 0 {
            return Err(MoveError::EmptyHouse);
        }

        let opponent = self.current_turn.opponent();

        // Must feed rule: if opponent has 0 seeds, we must choose a move that feeds them, if possible.
        if self.config.must_feed
            && self.total_seeds_on_side(opponent) == 0
            && !self.move_feeds(house)
        {
            // Check if there is ANY move that feeds.
            if self.can_feed() {
                return Err(MoveError::MustFeedOpponent);
            }
            // If no move can feed, the game should have ended on the previous turn,
            // but just in case, we capture remaining seeds and end.
        }

        // 1. Sowing
        let mut seeds = self.houses[house];
        self.houses[house] = 0;
        let mut current_idx = house;

        while seeds > 0 {
            current_idx = (current_idx + 1) % HOUSES;
            if current_idx == house {
                continue; // Skip origin house
            }
            self.houses[current_idx] += 1;
            seeds -= 1;
        }

        let last_idx = current_idx;

        // 2. Capturing
        if Self::is_owner(opponent, last_idx)
            && (self.houses[last_idx] == 2 || self.houses[last_idx] == 3)
        {
            // Determine sequence of capturable houses
            let mut capture_indices = alloc::vec::Vec::new();
            let mut idx = last_idx;
            while Self::is_owner(opponent, idx) && (self.houses[idx] == 2 || self.houses[idx] == 3)
            {
                capture_indices.push(idx);
                if idx == 0 {
                    idx = HOUSES - 1;
                } else {
                    idx -= 1;
                }
            }

            let captured_seeds: u8 = capture_indices.iter().map(|&i| self.houses[i]).sum();
            let total_opponent_seeds = self.total_seeds_on_side(opponent);

            let is_grand_slam = captured_seeds == total_opponent_seeds;

            if !(self.config.void_grand_slam && is_grand_slam) {
                // Execute capture
                for &i in &capture_indices {
                    self.houses[i] = 0;
                }
                *self.score_mut(self.current_turn) += captured_seeds;
            }
        }

        // 3. Post-move checks and end game conditions
        self.check_game_end();

        if self.state == GameState::InProgress {
            self.current_turn = opponent;

            // If the next player has no seeds, check if they can be fed.
            // If not, the current player (who just played) captures the rest.
            if self.total_seeds_on_side(self.current_turn) == 0
                && !self.can_feed_from(self.current_turn.opponent())
            {
                // The player who just played captures all their own remaining seeds.
                let remaining = self.total_seeds_on_side(self.current_turn.opponent());
                for i in Self::player_houses(self.current_turn.opponent()) {
                    self.houses[i] = 0;
                }
                *self.score_mut(self.current_turn.opponent()) += remaining;
                self.check_game_end();
            }
        }

        Ok(())
    }

    fn move_feeds(&self, house: usize) -> bool {
        // Because of skipping the origin house if seeds >= 12, simple arithmetic isn't always accurate.
        // Let's do a strict simulation for feeding:
        // But let's do a strict simulation for feeding:
        let mut sim = self.clone();
        sim.config.must_feed = false; // prevent recursion just in case
        let _ = sim.play_move(house);
        sim.total_seeds_on_side(self.current_turn.opponent()) > 0
    }

    fn can_feed(&self) -> bool {
        self.can_feed_from(self.current_turn)
    }

    fn can_feed_from(&self, player: Player) -> bool {
        for i in Self::player_houses(player) {
            if self.houses[i] > 0 && self.move_feeds(i) {
                return true;
            }
        }
        false
    }

    fn check_game_end(&mut self) {
        if self.p1_score >= 25 {
            self.state = GameState::Won(Player::Player1);
        } else if self.p2_score >= 25 {
            self.state = GameState::Won(Player::Player2);
        } else if self.p1_score == 24 && self.p2_score == 24 {
            self.state = GameState::Draw;
        } else {
            // Check if board is empty
            let total_on_board: u8 = self.houses.iter().sum();
            if total_on_board == 0 {
                if self.p1_score > self.p2_score {
                    self.state = GameState::Won(Player::Player1);
                } else if self.p2_score > self.p1_score {
                    self.state = GameState::Won(Player::Player2);
                } else {
                    self.state = GameState::Draw;
                }
            }
        }
    }
}
