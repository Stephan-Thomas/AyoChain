/// Calculates updated Elo ratings for two players following a match.
/// Uses scaled integer arithmetic (scale = 1000) for deterministic execution on-chain.
pub fn calculate_new_ratings(
    r1: u32,
    matches_played1: u32,
    r2: u32,
    matches_played2: u32,
    p1_won: bool,
    is_draw: bool,
) -> (u32, u32) {
    // Dynamic K-factor: higher for newer players
    let k1: i32 = if matches_played1 < 10 { 40 } else { 24 };
    let k2: i32 = if matches_played2 < 10 { 40 } else { 24 };
    let k = (k1 + k2) / 2;

    let diff = (r1 as i32) - (r2 as i32);
    let clamped_diff = diff.clamp(-400, 400);

    // Expected score for player 1 in thousandths (0 to 1000)
    let expected1 = 500 + (clamped_diff * 5) / 4;

    // Actual score for player 1 in thousandths
    let actual1 = if is_draw {
        500
    } else if p1_won {
        1000
    } else {
        0
    };

    // Rating delta
    let delta = (k * (actual1 - expected1)) / 1000;

    let new_r1_i32 = (r1 as i32) + delta;
    let new_r2_i32 = (r2 as i32) - delta;

    let new_r1 = if new_r1_i32 < 100 {
        100
    } else {
        new_r1_i32 as u32
    };
    let new_r2 = if new_r2_i32 < 100 {
        100
    } else {
        new_r2_i32 as u32
    };

    (new_r1, new_r2)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_equal_rating_win() {
        let (n1, n2) = calculate_new_ratings(1200, 20, 1200, 20, true, false);
        // k = 24. delta = 24 * (1000 - 500) / 1000 = +12
        assert_eq!(n1, 1212);
        assert_eq!(n2, 1188);
    }

    #[test]
    fn test_equal_rating_draw() {
        let (n1, n2) = calculate_new_ratings(1200, 20, 1200, 20, false, true);
        assert_eq!(n1, 1200);
        assert_eq!(n2, 1200);
    }

    #[test]
    fn test_underdog_upset() {
        // P1 has 1000, P2 has 1400. P1 wins!
        let (n1, n2) = calculate_new_ratings(1000, 20, 1400, 20, true, false);
        // diff = -400 -> expected1 = 500 - 500 = 0.
        // delta = 24 * (1000 - 0) / 1000 = +24
        assert_eq!(n1, 1024);
        assert_eq!(n2, 1376);
    }
}
