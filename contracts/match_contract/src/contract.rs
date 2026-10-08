use crate::types::{ContractBoard, DataKey, MatchState, MatchStatus};
use engine::{Board, Config};
use soroban_sdk::{Address, Env, contract, contractimpl, token};

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
            p1: creator,
            p2: None,
            token,
            stake,
            status: MatchStatus::WaitingForPlayer2,
            board: contract_board,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Match(match_id), &match_state);

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

        match_state.p2 = Some(joiner);
        match_state.status = MatchStatus::InProgress;

        env.storage()
            .persistent()
            .set(&DataKey::Match(match_id), &match_state);
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
    }

    pub fn get_match(env: Env, match_id: u64) -> Option<MatchState> {
        env.storage().persistent().get(&DataKey::Match(match_id))
    }
}
