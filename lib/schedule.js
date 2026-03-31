import { generateId } from "./storage";

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a new array */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Fixture generation ───────────────────────────────────────────────────────

/**
 * Generate every possible round-robin pairing for an array of teams.
 * Returns fixtures with sequential `order` starting at 1.
 */
export function roundRobinFixtures(teams) {
  const fixtures = [];
  for (let i = 0; i < teams.length - 1; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        id: generateId(),
        team1Id: teams[i].id,
        team2Id: teams[j].id,
        // Per-fixture player overrides (populated later for randomize-between-matches)
        team1PlayerIds: [...teams[i].playerIds],
        team2PlayerIds: [...teams[j].playerIds],
        matchId: null,
      });
    }
  }
  return fixtures.map((f, i) => ({ ...f, order: i + 1 }));
}

// ─── Player → Team assignment ─────────────────────────────────────────────────

/**
 * Assign player IDs to teams.
 * @param {string[]} playerIds  - pool of players to distribute
 * @param {object[]} teams      - array of { id, name }
 * @param {number}   perTeam    - players per team
 * @param {boolean}  randomize  - shuffle before assigning?
 */
export function assignPlayersToTeams(playerIds, teams, perTeam, randomize) {
  const ordered = randomize ? shuffle(playerIds) : [...playerIds];
  return teams.map((team, i) => ({
    ...team,
    playerIds: ordered.slice(i * perTeam, (i + 1) * perTeam),
  }));
}

/**
 * Re-randomize player assignment per fixture for the "randomize between matches" feature.
 * For each fixture the two participating teams draw from their combined player pool.
 */
export function randomizeFixturePlayers(fixtures, teams) {
  return fixtures.map((f) => {
    const t1 = teams.find((t) => t.id === f.team1Id);
    const t2 = teams.find((t) => t.id === f.team2Id);
    if (!t1 || !t2) return f;
    const pool = shuffle([...t1.playerIds, ...t2.playerIds]);
    const half = t1.playerIds.length;
    return {
      ...f,
      team1PlayerIds: pool.slice(0, half),
      team2PlayerIds: pool.slice(half, half + t2.playerIds.length),
    };
  });
}

// ─── Mode 2 – Auto Schedule ───────────────────────────────────────────────────

/**
 * Build a complete tournament from a flat player list.
 * @param {object[]} players         - player objects with { id, name }
 * @param {number}   teamSize        - players per team
 * @param {boolean}  randomize       - shuffle player assignment + fixture order?
 */
export function buildAutoSchedule({ players, teamSize, randomize }) {
  const numTeams = Math.floor(players.length / teamSize);

  // Build blank teams
  const blankTeams = Array.from({ length: numTeams }, (_, i) => ({
    id: `team_${generateId()}`,
    name: `Team ${i + 1}`,
    playerIds: [],
  }));

  // Assign players (randomize or sequential)
  const teams = assignPlayersToTeams(
    players.map((p) => p.id),
    blankTeams,
    teamSize,
    randomize
  );

  // Build fixtures and optionally shuffle order
  let fixtures = roundRobinFixtures(teams);
  if (randomize) {
    fixtures = shuffle(fixtures).map((f, i) => ({ ...f, order: i + 1 }));
  }

  return { teams, fixtures };
}

// ─── Mode 3 – Custom Schedule ─────────────────────────────────────────────────

/**
 * Build teams for a custom schedule given counts.
 * Players are assigned sequentially or randomly.
 */
export function buildCustomTeams({ players, numTeams, playersPerTeam, randomizePlayers }) {
  const blankTeams = Array.from({ length: numTeams }, (_, i) => ({
    id: `team_${generateId()}`,
    name: `Team ${i + 1}`,
    playerIds: [],
  }));

  return assignPlayersToTeams(
    players.map((p) => p.id),
    blankTeams,
    playersPerTeam,
    randomizePlayers
  );
}

/**
 * Convert a fixture definition list (using team 1-based indices) into full fixture objects
 * given an already-built teams array.
 *
 * @param {Array<{team1Idx, team2Idx}>} fixtureDefs - 0-based team indices
 * @param {object[]} teams
 */
export function buildFixturesFromDefs(fixtureDefs, teams) {
  return fixtureDefs.map((def, i) => {
    const t1 = teams[def.team1Idx];
    const t2 = teams[def.team2Idx];
    return {
      id: generateId(),
      order: i + 1,
      team1Id: t1.id,
      team2Id: t2.id,
      team1PlayerIds: [...t1.playerIds],
      team2PlayerIds: [...t2.playerIds],
      matchId: null,
    };
  });
}

/** Generate default round-robin fixture defs (0-based team indices) for numTeams */
export function defaultFixtureDefs(numTeams) {
  const defs = [];
  for (let i = 0; i < numTeams - 1; i++) {
    for (let j = i + 1; j < numTeams; j++) {
      defs.push({ id: generateId(), team1Idx: i, team2Idx: j });
    }
  }
  return defs;
}

// ─── Mode 3 – Fully custom per-match player assignment ────────────────────────

/**
 * Generate round-robin match defs for the custom schedule editor.
 * Each match def: { id, side1: [pid, ...], side2: [pid, ...] }
 *
 * Forms sequential teams from the player list, then creates all pairings.
 * e.g. 8 players, sideSize 2 → 4 teams: [P1,P2],[P3,P4],[P5,P6],[P7,P8]
 *                              → 6 round-robin matches
 */
export function autoGenerateRoundRobin(players, sideSize) {
  if (players.length < sideSize * 2) return [];
  const numTeams = Math.floor(players.length / sideSize);
  // Form teams sequentially
  const teams = Array.from({ length: numTeams }, (_, i) =>
    players.slice(i * sideSize, (i + 1) * sideSize).map((p) => p.id)
  );
  // Round-robin pairings
  const defs = [];
  for (let i = 0; i < teams.length - 1; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      defs.push({
        id: generateId(),
        side1: [...teams[i]],
        side2: [...teams[j]],
      });
    }
  }
  return defs;
}

/**
 * For each match def, take all assigned players from both sides and randomly
 * redistribute them back across the two sides, keeping the same side sizes.
 * Slots that were null remain null.
 */
export function randomizeMatchAssignments(matchDefs) {
  return matchDefs.map((m) => {
    const allIds = [...m.side1, ...m.side2];
    const filled = allIds.filter(Boolean);
    // Only shuffle the filled slots; leave nulls in place
    const shuffled = shuffle(filled);
    let si = 0;
    const rebuild = (arr) =>
      arr.map((v) => (v !== null ? shuffled[si++] ?? null : null));
    return {
      ...m,
      side1: rebuild(m.side1),
      side2: rebuild(m.side2),
    };
  });
}
