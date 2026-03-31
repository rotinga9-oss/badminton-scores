// localStorage keys
const PLAYERS_KEY = "badminton_players";
const MATCHES_KEY = "badminton_matches";

// Default 8 players
const DEFAULT_PLAYERS = Array.from({ length: 8 }, (_, i) => ({
  id: `player_${i + 1}`,
  name: `Player ${i + 1}`,
}));

// ─── Players ──────────────────────────────────────────────────────────────────

export function getPlayers() {
  if (typeof window === "undefined") return DEFAULT_PLAYERS;
  try {
    const raw = localStorage.getItem(PLAYERS_KEY);
    if (!raw) return DEFAULT_PLAYERS;
    const parsed = JSON.parse(raw);
    // If somehow fewer than 8 players are stored, pad with defaults
    if (!Array.isArray(parsed) || parsed.length < 8) return DEFAULT_PLAYERS;
    return parsed;
  } catch {
    return DEFAULT_PLAYERS;
  }
}

export function savePlayers(players) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

// ─── Matches ──────────────────────────────────────────────────────────────────

/**
 * Match shape:
 * {
 *   id: string,
 *   team1: [playerId, playerId],
 *   team2: [playerId, playerId],
 *   winner: 1 | 2,          // which team won
 *   date: ISO string,
 * }
 */

export function getMatches() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MATCHES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
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
  localStorage.setItem(MATCHES_KEY, JSON.stringify([]));
}

export function generateId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
