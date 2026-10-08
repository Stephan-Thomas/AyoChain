#![cfg(test)]

use super::*;
use crate::types::MatchStatus;
use soroban_sdk::token::{Client as TokenClient, StellarAssetClient};
use soroban_sdk::{Address, Env, testutils::Address as _};

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
