use soroban_sdk::{Address, contracttype};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    MatchContract,
    PlayerStats(Address),
    Leaderboard,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MatchOutcome {
    Player1Won,
    Player2Won,
    Draw,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlayerStats {
    pub rating: u32,
    pub matches_played: u32,
    pub wins: u32,
    pub losses: u32,
    pub draws: u32,
    pub earnings: i128,
    pub current_streak: u32,
    pub best_streak: u32,
}

impl Default for PlayerStats {
    fn default() -> Self {
        Self {
            rating: 1200,
            matches_played: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            earnings: 0,
            current_streak: 0,
            best_streak: 0,
        }
    }
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LeaderboardEntry {
    pub player: Address,
    pub rating: u32,
    pub wins: u32,
    pub earnings: i128,
}
