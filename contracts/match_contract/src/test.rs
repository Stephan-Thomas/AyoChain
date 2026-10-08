#![cfg(test)]

use super::*;
use crate::types::MatchStatus;
use soroban_sdk::token::{Client as TokenClient, StellarAssetClient};
use soroban_sdk::{
    Address, Env,
    testutils::{Address as _, Ledger},
};

fn create_token_contract<'a>(
    env: &Env,
    admin: &Address,
) -> (Address, StellarAssetClient<'a>, TokenClient<'a>) {
    let contract_id = env
        .register_stellar_asset_contract_v2(admin.clone())
        .address();
    (
        contract_id.clone(),
        StellarAssetClient::new(env, &contract_id),
        TokenClient::new(env, &contract_id),
    )
}

#[test]
fn test_create_match() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AyoMatchContract, ());
    let client = AyoMatchContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let (token_id, token_admin, token) = create_token_contract(&env, &admin);

    // Mint tokens to p1
    token_admin.mint(&p1, &1000);
    assert_eq!(token.balance(&p1), 1000);

    let stake = 100;
    let match_id = client.create_match(&p1, &token_id, &stake);

    assert_eq!(match_id, 1);
    assert_eq!(token.balance(&p1), 900);
    assert_eq!(token.balance(&contract_id), 100);

    let match_state = client.get_match(&match_id).unwrap();
    assert_eq!(match_state.id, 1);
    assert_eq!(match_state.p1, p1);
    assert_eq!(match_state.p2, None);
    assert_eq!(match_state.stake, stake);
    assert_eq!(match_state.status, MatchStatus::WaitingForPlayer2);
}

#[test]
fn test_join_match() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AyoMatchContract, ());
    let client = AyoMatchContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let (token_id, token_admin, token) = create_token_contract(&env, &admin);

    token_admin.mint(&p1, &1000);
    token_admin.mint(&p2, &1000);

    let match_id = client.create_match(&p1, &token_id, &100);
    client.join_match(&p2, &match_id);

    assert_eq!(token.balance(&p2), 900);
    // Contract now holds both stakes
    assert_eq!(token.balance(&contract_id), 200);

    let match_state = client.get_match(&match_id).unwrap();
    assert_eq!(match_state.p2, Some(p2));
    assert_eq!(match_state.status, MatchStatus::InProgress);
}

#[test]
fn test_cancel_match() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AyoMatchContract, ());
    let client = AyoMatchContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let (token_id, token_admin, token) = create_token_contract(&env, &admin);

    token_admin.mint(&p1, &1000);

    let match_id = client.create_match(&p1, &token_id, &100);
    assert_eq!(token.balance(&p1), 900);
    assert_eq!(token.balance(&contract_id), 100);

    client.cancel_match(&match_id);

    // Stake refunded
    assert_eq!(token.balance(&p1), 1000);
    assert_eq!(token.balance(&contract_id), 0);

    let match_state = client.get_match(&match_id).unwrap();
    assert_eq!(match_state.status, MatchStatus::Cancelled);
}

#[test]
fn test_play_move() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AyoMatchContract, ());
    let client = AyoMatchContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let (token_id, token_admin, token) = create_token_contract(&env, &admin);

    token_admin.mint(&p1, &1000);
    token_admin.mint(&p2, &1000);

    let match_id = client.create_match(&p1, &token_id, &100);
    client.join_match(&p2, &match_id);

    // Initial state: p1's turn
    let state_before = client.get_match(&match_id).unwrap();
    assert_eq!(state_before.status, MatchStatus::InProgress);

    // Player 1 plays house 0
    client.play_move(&p1, &match_id, &0);

    let state_after = client.get_match(&match_id).unwrap();
    // House 0 should be empty
    assert_eq!(state_after.board.houses.get(0).unwrap(), 0);
}

#[test]
#[should_panic(expected = "Not your turn")]
fn test_play_move_wrong_turn() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AyoMatchContract, ());
    let client = AyoMatchContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let (token_id, token_admin, _) = create_token_contract(&env, &admin);

    token_admin.mint(&p1, &1000);
    token_admin.mint(&p2, &1000);

    let match_id = client.create_match(&p1, &token_id, &100);
    client.join_match(&p2, &match_id);

    // Player 2 tries to play on Player 1's turn
    client.play_move(&p2, &match_id, &6);
}

#[test]
fn test_resign() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AyoMatchContract, ());
    let client = AyoMatchContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let (token_id, token_admin, token) = create_token_contract(&env, &admin);

    token_admin.mint(&p1, &1000);
    token_admin.mint(&p2, &1000);

    let match_id = client.create_match(&p1, &token_id, &100);
    client.join_match(&p2, &match_id);

    // Player 1 resigns
    client.resign(&p1, &match_id);

    let state = client.get_match(&match_id).unwrap();
    assert_eq!(state.status, MatchStatus::FinishedWon(p2.clone()));

    // Player 2 gets the pot (200) + remaining balance (900) = 1100
    assert_eq!(token.balance(&p2), 1100);
}

#[test]
fn test_claim_timeout() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(AyoMatchContract, ());
    let client = AyoMatchContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let (token_id, token_admin, token) = create_token_contract(&env, &admin);

    token_admin.mint(&p1, &1000);
    token_admin.mint(&p2, &1000);

    let match_id = client.create_match(&p1, &token_id, &100);
    client.join_match(&p2, &match_id);

    // Advance time by 1 day and 1 second
    env.ledger().set_timestamp(86401);

    // Player 1's turn, so Player 2 can claim timeout
    client.claim_timeout(&p2, &match_id);

    let state = client.get_match(&match_id).unwrap();
    assert_eq!(state.status, MatchStatus::FinishedWon(p2.clone()));

    // Player 2 gets the pot
    assert_eq!(token.balance(&p2), 1100);
}
