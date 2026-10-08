use crate::rules::MoveError;
use crate::*;

#[test]
fn test_initial_state() {
    let board = Board::default();
    assert_eq!(board.houses, [4; 12]);
    assert_eq!(board.p1_score, 0);
    assert_eq!(board.p2_score, 0);
    assert_eq!(board.current_turn, Player::Player1);
    assert_eq!(board.state, GameState::InProgress);
}

#[test]
fn test_basic_move() {
    let mut board = Board::default();
    assert_eq!(board.play_move(0), Ok(()));
    assert_eq!(board.houses[0], 0);
    assert_eq!(board.houses[1], 5);
    assert_eq!(board.houses[2], 5);
    assert_eq!(board.houses[3], 5);
    assert_eq!(board.houses[4], 5);
    assert_eq!(board.houses[5], 4);
    assert_eq!(board.current_turn, Player::Player2);
}

#[test]
fn test_skip_origin_when_12_seeds() {
    let mut board = Board::default();
    board.houses = [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    assert_eq!(board.play_move(0), Ok(()));
    assert_eq!(board.houses[0], 0); // Origin skipped
    assert_eq!(board.houses[1], 2); // 12th seed wraps around and lands here
    for i in 2..12 {
        assert_eq!(board.houses[i], 1);
    }
    // The last seed lands in house 1.
    // Player 1 played. Last seed is in Player 1's side (house 1).
    // So no capture.
}

#[test]
fn test_basic_capture() {
    let mut board = Board::default();
    // P1 plays house 4, which has 2 seeds. They land in 5 and 6.
    board.houses[4] = 2;
    board.houses[6] = 1; // 1 + 1 = 2 (capture!)
    assert_eq!(board.play_move(4), Ok(()));
    assert_eq!(board.p1_score, 2);
    assert_eq!(board.houses[6], 0);
}

#[test]
fn test_must_feed() {
    let mut board = Board::default();
    // P2 has no seeds
    board.houses = [0; 12];
    board.houses[4] = 1; // move to 5 (doesn't feed P2)
    board.houses[5] = 2; // move to 6 and 7 (feeds P2)
    board.current_turn = Player::Player1;

    // Trying to play house 4 should fail because it doesn't feed
    assert_eq!(board.play_move(4), Err(MoveError::MustFeedOpponent));

    // Playing house 5 should succeed
    assert_eq!(board.play_move(5), Ok(()));
}

#[test]
fn test_grand_slam_void() {
    let mut board = Board::default();
    board.houses = [0; 12];
    board.houses[5] = 4; // lands in 6, 7, 8, 9 (P2 side)
    board.houses[6] = 1;
    board.houses[7] = 2;
    board.houses[8] = 1;
    board.houses[9] = 2;
    // Total seeds on P2 side initially = 6.
    // After move:
    // 6 gets 1 -> 2
    // 7 gets 1 -> 3
    // 8 gets 1 -> 2
    // 9 gets 1 -> 3
    // All 4 houses on P2 side have 2 or 3 seeds and total 10 seeds.

    assert_eq!(board.play_move(5), Ok(()));
    // Since void_grand_slam is true (default), no capture occurs
    assert_eq!(board.p1_score, 0);
    assert_eq!(board.houses[6], 2);
    assert_eq!(board.houses[9], 3);
}

use proptest::prelude::*;

proptest! {
    #[test]
    fn test_invariant_total_seeds_48(
        moves in prop::collection::vec(0usize..6, 0..100)
    ) {
        let mut board = Board::default();
        for &m in &moves {
            // Find a valid house to play
            let mut house_to_play = m;
            if board.current_turn == Player::Player2 {
                house_to_play += 6;
            }
            let _ = board.play_move(house_to_play);

            let total_on_board: u8 = board.houses.iter().sum();
            assert_eq!(total_on_board + board.p1_score + board.p2_score, 48);

            if board.state != GameState::InProgress {
                break;
            }
        }
    }
}
