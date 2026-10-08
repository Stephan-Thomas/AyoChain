#![cfg(test)]

use super::*;
use soroban_sdk::{Address, Env, testutils::Address as _};
use types::MatchOutcome;

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register(RankingsContract, ());
    let client = RankingsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let p1 = Address::generate(&env);
    let stats = client.get_player_stats(&p1);
    assert_eq!(stats.rating, 1200);
    assert_eq!(stats.matches_played, 0);
    assert_eq!(stats.wins, 0);
    assert_eq!(stats.earnings, 0);
}

#[test]
fn test_record_match_p1_win() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(RankingsContract, ());
    let client = RankingsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);

    client.record_match_result(&admin, &p1, &p2, &MatchOutcome::Player1Won, &10_000_000);

    let stats1 = client.get_player_stats(&p1);
    let stats2 = client.get_player_stats(&p2);

    // Initial matches: K = 40. diff = 0 -> expected = 500. delta = 40 * (1000 - 500) / 1000 = +20
    assert_eq!(stats1.rating, 1220);
    assert_eq!(stats1.wins, 1);
    assert_eq!(stats1.losses, 0);
    assert_eq!(stats1.current_streak, 1);
    assert_eq!(stats1.earnings, 10_000_000);

    assert_eq!(stats2.rating, 1180);
    assert_eq!(stats2.wins, 0);
    assert_eq!(stats2.losses, 1);
    assert_eq!(stats2.current_streak, 0);
    assert_eq!(stats2.earnings, -10_000_000);

    // Check leaderboard has P1 at rank 1, P2 at rank 2
    let leaderboard = client.get_leaderboard(&10);
    assert_eq!(leaderboard.len(), 2);
    assert_eq!(leaderboard.get(0).unwrap().player, p1);
    assert_eq!(leaderboard.get(0).unwrap().rating, 1220);
    assert_eq!(leaderboard.get(1).unwrap().player, p2);
    assert_eq!(leaderboard.get(1).unwrap().rating, 1180);
}

#[test]
fn test_draw_outcome() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(RankingsContract, ());
    let client = RankingsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);

    client.record_match_result(&admin, &p1, &p2, &MatchOutcome::Draw, &5_000_000);

    let stats1 = client.get_player_stats(&p1);
    let stats2 = client.get_player_stats(&p2);

    assert_eq!(stats1.rating, 1200);
    assert_eq!(stats1.draws, 1);
    assert_eq!(stats1.earnings, 0);

    assert_eq!(stats2.rating, 1200);
    assert_eq!(stats2.draws, 1);
    assert_eq!(stats2.earnings, 0);
}

#[test]
fn test_consecutive_wins_and_streak() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(RankingsContract, ());
    let client = RankingsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);

    // P1 wins twice
    client.record_match_result(&admin, &p1, &p2, &MatchOutcome::Player1Won, &10_000_000);
    client.record_match_result(&admin, &p1, &p2, &MatchOutcome::Player1Won, &10_000_000);

    let stats1 = client.get_player_stats(&p1);
    assert_eq!(stats1.wins, 2);
    assert_eq!(stats1.current_streak, 2);
    assert_eq!(stats1.best_streak, 2);
    assert_eq!(stats1.earnings, 20_000_000);

    // P2 wins match 3 -> P1 streak resets
    client.record_match_result(&admin, &p1, &p2, &MatchOutcome::Player2Won, &10_000_000);
    let stats1_after = client.get_player_stats(&p1);
    assert_eq!(stats1_after.wins, 2);
    assert_eq!(stats1_after.losses, 1);
    assert_eq!(stats1_after.current_streak, 0);
    assert_eq!(stats1_after.best_streak, 2); // Best streak preserved!
}
