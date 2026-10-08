use crate::elo::calculate_new_ratings;
use crate::types::{DataKey, LeaderboardEntry, MatchOutcome, PlayerStats};
use soroban_sdk::{Address, Env, Vec, contract, contractimpl};

#[contract]
pub struct RankingsContract;

#[contractimpl]
impl RankingsContract {
    /// Initialize the rankings contract with an admin
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        let empty_board: Vec<LeaderboardEntry> = Vec::new(&env);
        env.storage()
            .instance()
            .set(&DataKey::Leaderboard, &empty_board);
    }

    /// Set or update the authorized match contract address
    pub fn set_match_contract(env: Env, match_contract: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        admin.require_auth();
        env.storage()
            .instance()
            .set(&DataKey::MatchContract, &match_contract);
    }

    /// Record match outcome, update Elo ratings, win/loss stats, streaks, and token earnings
    pub fn record_match_result(
        env: Env,
        caller: Address,
        player1: Address,
        player2: Address,
        outcome: MatchOutcome,
        wager: i128,
    ) {
        caller.require_auth();

        // Ensure caller is either admin or the match contract
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        let authorized = if caller == admin {
            true
        } else if let Some(match_contract) = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::MatchContract)
        {
            caller == match_contract
        } else {
            false
        };

        if !authorized {
            panic!("Unauthorized caller");
        }

        // Fetch current stats
        let mut p1_stats = Self::get_player_stats(env.clone(), player1.clone());
        let mut p2_stats = Self::get_player_stats(env.clone(), player2.clone());

        let p1_won = outcome == MatchOutcome::Player1Won;
        let is_draw = outcome == MatchOutcome::Draw;

        // Calculate new Elo ratings
        let (new_r1, new_r2) = calculate_new_ratings(
            p1_stats.rating,
            p1_stats.matches_played,
            p2_stats.rating,
            p2_stats.matches_played,
            p1_won,
            is_draw,
        );

        p1_stats.rating = new_r1;
        p2_stats.rating = new_r2;
        p1_stats.matches_played += 1;
        p2_stats.matches_played += 1;

        match outcome {
            MatchOutcome::Player1Won => {
                p1_stats.wins += 1;
                p1_stats.current_streak += 1;
                if p1_stats.current_streak > p1_stats.best_streak {
                    p1_stats.best_streak = p1_stats.current_streak;
                }
                p1_stats.earnings += wager;

                p2_stats.losses += 1;
                p2_stats.current_streak = 0;
                p2_stats.earnings -= wager;
            }
            MatchOutcome::Player2Won => {
                p2_stats.wins += 1;
                p2_stats.current_streak += 1;
                if p2_stats.current_streak > p2_stats.best_streak {
                    p2_stats.best_streak = p2_stats.current_streak;
                }
                p2_stats.earnings += wager;

                p1_stats.losses += 1;
                p1_stats.current_streak = 0;
                p1_stats.earnings -= wager;
            }
            MatchOutcome::Draw => {
                p1_stats.draws += 1;
                p2_stats.draws += 1;
                p1_stats.current_streak = 0;
                p2_stats.current_streak = 0;
            }
        }

        // Save updated stats
        env.storage()
            .persistent()
            .set(&DataKey::PlayerStats(player1.clone()), &p1_stats);
        env.storage()
            .persistent()
            .set(&DataKey::PlayerStats(player2.clone()), &p2_stats);

        // Update leaderboard cache
        Self::update_leaderboard_entry(
            &env,
            player1.clone(),
            p1_stats.rating,
            p1_stats.wins,
            p1_stats.earnings,
        );
        Self::update_leaderboard_entry(
            &env,
            player2.clone(),
            p2_stats.rating,
            p2_stats.wins,
            p2_stats.earnings,
        );

        // Emit ratings updated event
        env.events().publish(
            (
                soroban_sdk::symbol_short!("elo_upd"),
                player1.clone(),
                player2.clone(),
            ),
            (new_r1, new_r2),
        );
    }

    /// Retrieve stats for a specific player (or defaults if unranked)
    pub fn get_player_stats(env: Env, player: Address) -> PlayerStats {
        env.storage()
            .persistent()
            .get(&DataKey::PlayerStats(player))
            .unwrap_or_default()
    }

    /// Retrieve the top ranked players up to `limit`
    pub fn get_leaderboard(env: Env, limit: u32) -> Vec<LeaderboardEntry> {
        let board: Vec<LeaderboardEntry> = env
            .storage()
            .instance()
            .get(&DataKey::Leaderboard)
            .unwrap_or(Vec::new(&env));

        let total = board.len();
        let target_len = if limit < total { limit } else { total };

        let mut result = Vec::new(&env);
        for i in 0..target_len {
            if let Some(entry) = board.get(i) {
                result.push_back(entry);
            }
        }
        result
    }

    fn update_leaderboard_entry(
        env: &Env,
        player: Address,
        rating: u32,
        wins: u32,
        earnings: i128,
    ) {
        let board: Vec<LeaderboardEntry> = env
            .storage()
            .instance()
            .get(&DataKey::Leaderboard)
            .unwrap_or(Vec::new(env));

        let mut new_board = Vec::new(env);
        let mut replaced = false;

        for i in 0..board.len() {
            if let Some(entry) = board.get(i) {
                if entry.player == player {
                    new_board.push_back(LeaderboardEntry {
                        player: player.clone(),
                        rating,
                        wins,
                        earnings,
                    });
                    replaced = true;
                } else {
                    new_board.push_back(entry);
                }
            }
        }

        if !replaced {
            new_board.push_back(LeaderboardEntry {
                player,
                rating,
                wins,
                earnings,
            });
        }

        // Sort new_board by rating descending (insertion sort suitable for Soroban Vec)
        let len = new_board.len();
        for i in 0..len {
            for j in (i + 1)..len {
                let a = new_board.get(i).unwrap();
                let b = new_board.get(j).unwrap();
                if b.rating > a.rating {
                    new_board.set(i, b);
                    new_board.set(j, a);
                }
            }
        }

        env.storage()
            .instance()
            .set(&DataKey::Leaderboard, &new_board);
    }
}
