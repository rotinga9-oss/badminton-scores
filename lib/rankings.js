/**
 * Ranking logic:
 *  - Win  → +2 points for each member of the winning team
 *  - Loss → +0 points
 *  - Tiebreaker: head-to-head wins between tied players
 *    (# of matches where A's team beat B's team)
 */

/**
 * Build per-player stats from matches.
 * Returns a Map<playerId, { id, name, points, wins, losses, matches }>
 */
export function buildStats(players, matches) {
  const stats = new Map(
    players.map((p) => [
      p.id,
      { id: p.id, name: p.name, points: 0, wins: 0, losses: 0, matches: 0 },
    ])
  );

  for (const match of matches) {
    const { team1, team2, winner } = match;
    const winTeam = winner === 1 ? team1 : team2;
    const loseTeam = winner === 1 ? team2 : team1;

    for (const pid of winTeam) {
      const s = stats.get(pid);
      if (s) { s.points += 2; s.wins += 1; s.matches += 1; }
    }
    for (const pid of loseTeam) {
      const s = stats.get(pid);
      if (s) { s.losses += 1; s.matches += 1; }
    }
  }

  return stats;
}

/**
 * Count head-to-head wins: how many times A's team beat B's team
 * when they were on opposing sides.
 */
export function headToHeadWins(playerA, playerB, matches) {
  let aWins = 0;
  let bWins = 0;

  for (const match of matches) {
    const { team1, team2, winner } = match;
    const aInT1 = team1.includes(playerA);
    const aInT2 = team2.includes(playerA);
    const bInT1 = team1.includes(playerB);
    const bInT2 = team2.includes(playerB);

    // Must be on opposing teams
    if (!((aInT1 && bInT2) || (aInT2 && bInT1))) continue;

    if ((aInT1 && winner === 1) || (aInT2 && winner === 2)) aWins++;
    else if ((bInT1 && winner === 1) || (bInT2 && winner === 2)) bWins++;
  }

  return { aWins, bWins };
}

/**
 * Returns sorted rankings:
 * [{ rank, id, name, points, wins, losses, matches }, ...]
 *
 * Tiebreaker: if same points, player with more h2h wins ranks higher.
 * If still equal (or no h2h matches), share the rank.
 */
export function computeRankings(players, matches) {
  const statsMap = buildStats(players, matches);
  const entries = [...statsMap.values()];

  entries.sort((a, b) => {
    // Primary: points descending
    if (b.points !== a.points) return b.points - a.points;
    // Tiebreaker: head-to-head
    const { aWins, bWins } = headToHeadWins(a.id, b.id, matches);
    if (aWins !== bWins) return aWins > bWins ? -1 : 1; // higher h2h wins → ranks higher
    // Final fallback: alphabetical
    return a.name.localeCompare(b.name);
  });

  // Assign ranks — shared rank when truly tied (same points + equal h2h)
  const ranked = [];
  for (let i = 0; i < entries.length; i++) {
    if (i === 0) {
      ranked.push({ ...entries[i], rank: 1 });
      continue;
    }
    const prev = entries[i - 1];
    const curr = entries[i];
    const samePoints = prev.points === curr.points;
    let share = false;
    if (samePoints) {
      const { aWins, bWins } = headToHeadWins(prev.id, curr.id, matches);
      share = aWins === bWins;
    }
    ranked.push({ ...curr, rank: share ? ranked[i - 1].rank : i + 1 });
  }

  return ranked;
}
