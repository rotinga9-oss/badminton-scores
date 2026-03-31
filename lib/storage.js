// ─── Keys ─────────────────────────────────────────────────────────────────────
const SPORT_KEY      = "app_sport_name";
const PLAYERS_KEY    = "app_players";
const MATCHES_KEY    = "app_matches";
const TOURNAMENT_KEY = "app_tournament";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Sport Name ───────────────────────────────────────────────────────────────
export function getSport() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SPORT_KEY) || null;
}

export function saveSport(name) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SPORT_KEY, name.trim());
}

// ─── Players ──────────────────────────────────────────────────────────────────
const DEFAULT_COUNT = 8;

function makeDefaultPlayers(count = DEFAULT_COUNT) {
  return Array.from({ length: count }, (_, i) => ({
    id: `player_${i + 1}`,
    name: `Player ${i + 1}`,
  }));
}

export function getPlayers() {
  if (typeof window === "undefined") return makeDefaultPlayers();
  try {
    const raw = localStorage.getItem(PLAYERS_KEY);
    if (!raw) return makeDefaultPlayers();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : makeDefaultPlayers();
  } catch {
    return makeDefaultPlayers();
  }
}

export function savePlayers(players) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

/** Ensure the roster has at least `count` players (pads with defaults). */
export function ensurePlayers(count = DEFAULT_COUNT) {
  const existing = getPlayers();
  if (existing.length >= count) return existing;
  const padded = [...existing];
  for (let i = existing.length; i < count; i++) {
    padded.push({ id: `player_${i + 1}`, name: `Player ${i + 1}` });
  }
  savePlayers(padded);
  return padded;
}

// ─── Matches ──────────────────────────────────────────────────────────────────
/**
 * Match shape:
 * {
 *   id: string,
 *   team1: [playerId, playerId],
 *   team2: [playerId, playerId],
 *   winner: 1 | 2,
 *   date: ISO string,
 *   fixtureId?: string,   // if recorded as part of a tournament fixture
 * }
 */
export function getMatches() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MATCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMatch(match) {
  const matches = getMatches();
  matches.push(match);
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
}

export function deleteMatch(matchId) {
  const matches = getMatches().filter((m) => m.id !== matchId);
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
}

export function clearAllMatches() {
  localStorage.setItem(MATCHES_KEY, "[]");
}

// ─── Tournament ───────────────────────────────────────────────────────────────
/**
 * Tournament shape:
 * {
 *   id: string,
 *   createdAt: ISO string,
 *   sport: string,
 *   mode: 'auto' | 'custom',
 *   teams: [{ id, name, playerIds: string[] }],
 *   fixtures: [{
 *     id, order: number,
 *     team1Id, team2Id,
 *     matchId: string | null,      // null = not played
 *     team1PlayerIds: string[],    // per-fixture player assignment (for randomize-between-matches)
 *     team2PlayerIds: string[],
 *   }],
 *   randomizeBetweenMatches: boolean,
 *   status: 'active' | 'completed',
 * }
 */
export function getTournament() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TOURNAMENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTournament(t) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOURNAMENT_KEY, JSON.stringify(t));
}

export function updateTournamentFixture(fixtureId, changes) {
  const t = getTournament();
  if (!t) return;
  t.fixtures = t.fixtures.map((f) =>
    f.id === fixtureId ? { ...f, ...changes } : f
  );
  // Auto-complete tournament when all fixtures are done
  if (t.fixtures.every((f) => f.matchId !== null)) {
    t.status = "completed";
  }
  saveTournament(t);
}

export function clearTournament() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOURNAMENT_KEY);
}
