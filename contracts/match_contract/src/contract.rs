use crate::types::{ContractBoard, DataKey, MatchState, MatchStatus};
use engine::{Board, Config, GameState, MoveError, Player};
use soroban_sdk::{Address, Env, contract, contractimpl, symbol_short, token};

const TIMEOUT_SECONDS: u64 = 86400; // 1 day

fn payout(env: &Env, state: &MatchState) {
    let token_client = token::Client::new(env, &state.token);
    match &state.status {
        MatchStatus::FinishedWon(winner) => {
            let total_pot = state.stake * 2;
            token_client.transfer(&env.current_contract_address(), winner, &total_pot);
        }
        MatchStatus::FinishedDraw => {
            token_client.transfer(&env.current_contract_address(), &state.p1, &state.stake);
            let p2 = state.p2.as_ref().unwrap();
            token_client.transfer(&env.current_contract_address(), p2, &state.stake);
        }
        _ => {}
    }
}

#[contract]
pub struct AyoMatchContract;

#[contractimpl]
impl AyoMatchContract {
    pub fn create_match(env: Env, creator: Address, token: Address, stake: i128) -> u64 {
        creator.require_auth();

        if stake < 0 {
            panic!("Stake cannot be negative");
        }

        // Transfer stake from creator to the contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&creator, &env.current_contract_address(), &stake);

        let match_count = env
            .storage()
            .instance()
            .get(&DataKey::MatchCount)
            .unwrap_or(0u64);
        let match_id = match_count + 1;
        env.storage()
            .instance()
            .set(&DataKey::MatchCount, &match_id);

        let board = Board::new(Config::default());
        let contract_board = ContractBoard::from_engine(&env, &board);

        let match_state = MatchState {
            id: match_id,
            p1: creator.clone(),
            p2: None,
            token,
            stake,
            status: MatchStatus::WaitingForPlayer2,
            board: contract_board,
            last_move_timestamp: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::Match(match_id), &match_state);

        env.events().publish(
            (symbol_short!("match"), symbol_short!("create"), match_id),
            creator.clone(),
        );

        match_id
    }

    pub fn join_match(env: Env, joiner: Address, match_id: u64) {
        joiner.require_auth();

        let mut match_state: MatchState = env
            .storage()
            .persistent()
            .get(&DataKey::Match(match_id))
            .expect("Match not found");

        if match_state.status != MatchStatus::WaitingForPlayer2 {
            panic!("Match is not waiting for a player");
        }

        if match_state.p1 == joiner {
            panic!("Creator cannot join their own match");
        }

        // Transfer stake from joiner to the contract
        let token_client = token::Client::new(&env, &match_state.token);
        token_client.transfer(&joiner, &env.current_contract_address(), &match_state.stake);

        match_state.p2 = Some(joiner.clone());
        match_state.status = MatchStatus::InProgress;
        match_state.last_move_timestamp = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Match(match_id), &match_state);

        env.events().publish(
            (symbol_short!("match"), symbol_short!("join"), match_id),
            joiner,
        );
    }

    pub fn cancel_match(env: Env, match_id: u64) {
        let mut match_state: MatchState = env
            .storage()
            .persistent()
            .get(&DataKey::Match(match_id))
            .expect("Match not found");

        match_state.p1.require_auth();

        if match_state.status != MatchStatus::WaitingForPlayer2 {
            panic!("Match cannot be cancelled at this stage");
        }

        // Refund stake to creator
        let token_client = token::Client::new(&env, &match_state.token);
        token_client.transfer(
            &env.current_contract_address(),
            &match_state.p1,
            &match_state.stake,
        );

        match_state.status = MatchStatus::Cancelled;
        env.storage()
            .persistent()
            .set(&DataKey::Match(match_id), &match_state);

        env.events().publish(
            (symbol_short!("match"), symbol_short!("cancel"), match_id),
            match_state.p1.clone(),
        );
    }

    pub fn get_match(env: Env, match_id: u64) -> Option<MatchState> {
        env.storage().persistent().get(&DataKey::Match(match_id))
    }

    pub fn play_move(env: Env, player: Address, match_id: u64, house: u32) {
        player.require_auth();

        let mut state: MatchState = env
            .storage()
            .persistent()
            .get(&DataKey::Match(match_id))
            .expect("Match not found");
        if state.status != MatchStatus::InProgress {
            panic!("Match is not in progress");
        }

        let mut engine_board = state.board.to_engine();
        let current_player = engine_board.current_turn;

        // Ensure the correct player is calling
        let expected_caller = match current_player {
            Player::Player1 => &state.p1,
            Player::Player2 => state.p2.as_ref().unwrap(),
        };
        if player != *expected_caller {
            panic!("Not your turn");
        }

        match engine_board.play_move(house as usize) {
            Ok(()) => {}
            Err(MoveError::GameAlreadyOver) => panic!("Game already over"),
            Err(MoveError::InvalidHouse) => panic!("Invalid house"),
            Err(MoveError::EmptyHouse) => panic!("Empty house"),
            Err(MoveError::MustFeedOpponent) => panic!("Must feed opponent"),
        }

        // Check if game ended
        match engine_board.state {
            GameState::Won(Player::Player1) => {
                state.status = MatchStatus::FinishedWon(state.p1.clone())
            }
            GameState::Won(Player::Player2) => {
                state.status = MatchStatus::FinishedWon(state.p2.clone().unwrap())
            }
            GameState::Draw => state.status = MatchStatus::FinishedDraw,
            GameState::InProgress => {}
        }

        state.board = ContractBoard::from_engine(&env, &engine_board);
        state.last_move_timestamp = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::Match(match_id), &state);
        env.events().publish(
            (symbol_short!("match"), symbol_short!("move"), match_id),
            (player, house),
        );

        if state.status != MatchStatus::InProgress {
            payout(&env, &state);
            env.events().publish(
                (symbol_short!("match"), symbol_short!("finish"), match_id),
                (),
            );
        }
    }

    pub fn resign(env: Env, player: Address, match_id: u64) {
        player.require_auth();
        let mut state: MatchState = env
            .storage()
            .persistent()
            .get(&DataKey::Match(match_id))
            .expect("Match not found");
        if state.status != MatchStatus::InProgress {
            panic!("Match not in progress");
        }

        let p2 = state.p2.clone().unwrap();
        if player != state.p1 && player != p2 {
            panic!("Not a player in this match");
        }

        let winner = if player == state.p1 {
            p2
        } else {
            state.p1.clone()
        };
        state.status = MatchStatus::FinishedWon(winner);
        env.storage()
            .persistent()
            .set(&DataKey::Match(match_id), &state);

        payout(&env, &state);
        env.events().publish(
            (symbol_short!("match"), symbol_short!("resign"), match_id),
            player,
        );
        env.events().publish(
            (symbol_short!("match"), symbol_short!("finish"), match_id),
            (),
        );
    }

    pub fn claim_timeout(env: Env, claimer: Address, match_id: u64) {
        claimer.require_auth();
        let mut state: MatchState = env
            .storage()
            .persistent()
            .get(&DataKey::Match(match_id))
            .expect("Match not found");
        if state.status != MatchStatus::InProgress {
            panic!("Match not in progress");
        }

        let current_time = env.ledger().timestamp();
        if current_time - state.last_move_timestamp < TIMEOUT_SECONDS {
            panic!("Timeout not yet reached");
        }

        let p2 = state.p2.clone().unwrap();
        if claimer != state.p1 && claimer != p2 {
            panic!("Not a player in this match");
        }

        // The player who didn't play in time loses.
        // We figure out whose turn it was.
        let engine_board = state.board.to_engine();
        let expected_caller = match engine_board.current_turn {
            Player::Player1 => &state.p1,
            Player::Player2 => &p2,
        };

        if claimer == *expected_caller {
            panic!("You cannot claim timeout on yourself");
        }

        state.status = MatchStatus::FinishedWon(claimer.clone());
        env.storage()
            .persistent()
            .set(&DataKey::Match(match_id), &state);

        payout(&env, &state);
        env.events().publish(
            (symbol_short!("match"), symbol_short!("timeout"), match_id),
            claimer,
        );
        env.events().publish(
            (symbol_short!("match"), symbol_short!("finish"), match_id),
            (),
        );
    }
}
