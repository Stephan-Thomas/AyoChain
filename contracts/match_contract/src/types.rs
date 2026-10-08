use soroban_sdk::{Address, BytesN, Env, contracttype};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MatchStatus {
    WaitingForPlayer2,
    InProgress,
    FinishedWon(Address),
    FinishedDraw,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ContractBoard {
    pub houses: BytesN<12>,
    pub p1_score: u32,
    pub p2_score: u32,
    pub current_turn_is_p1: bool,
    pub must_feed: bool,
    pub void_grand_slam: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MatchState {
    pub id: u64,
    pub p1: Address,
    pub p2: Option<Address>,
    pub token: Address,
    pub stake: i128,
    pub status: MatchStatus,
    pub board: ContractBoard,
    pub last_move_timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    MatchCount,
    Match(u64),
}

impl ContractBoard {
    pub fn from_engine(env: &Env, board: &engine::Board) -> Self {
        let mut houses_arr = [0u8; 12];
        houses_arr.copy_from_slice(&board.houses);
        Self {
            houses: BytesN::from_array(env, &houses_arr),
            p1_score: board.p1_score as u32,
            p2_score: board.p2_score as u32,
            current_turn_is_p1: board.current_turn == engine::Player::Player1,
            must_feed: board.config.must_feed,
            void_grand_slam: board.config.void_grand_slam,
        }
    }

    pub fn to_engine(&self) -> engine::Board {
        let mut board = engine::Board::default();
        board.houses.copy_from_slice(&self.houses.to_array());
        board.p1_score = self.p1_score as u8;
        board.p2_score = self.p2_score as u8;
        board.current_turn = if self.current_turn_is_p1 {
            engine::Player::Player1
        } else {
            engine::Player::Player2
        };
        board.config.must_feed = self.must_feed;
        board.config.void_grand_slam = self.void_grand_slam;
        // Game state logic isn't fully preserved in ContractBoard since MatchState manages it,
        // but we just reset it to InProgress for engine to work on it.
        board.state = engine::GameState::InProgress;
        board
    }
}
