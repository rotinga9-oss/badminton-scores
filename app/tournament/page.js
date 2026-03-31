"use client";
import { useState, useEffect } from "react";
import {
  getTournament,
  saveTournament,
  updateTournamentFixture,
  clearTournament,
  getPlayers,
  getMatches,
  saveMatch,
  generateId,
} from "@/lib/storage";
import { computeRankings } from "@/lib/rankings";
import { randomizeFixturePlayers } from "@/lib/schedule";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function playerName(id, players) {
  return players.find((p) => p.id === id)?.name ?? id;
}

function teamLabel(team, playerIds, players) {
  const names = playerIds.map((id) => playerName(id, players));
  return `${team.name}: ${names.join(" & ")}`;
}

// ─── Inline Result Recorder ───────────────────────────────────────────────────
function RecordResult({ fixture, tournament, players, onSave, onCancel }) {
  const [winner, setWinner] = useState(null);

  const t1 = tournament.teams.find((t) => t.id === fixture.team1Id);
  const t2 = tournament.teams.find((t) => t.id === fixture.team2Id);

  const t1Players = fixture.team1PlayerIds ?? t1?.playerIds ?? [];
  const t2Players = fixture.team2PlayerIds ?? t2?.playerIds ?? [];

  function handleSave() {
    if (!winner) return;
    const match = {
      id: generateId(),
      team1: t1Players,
      team2: t2Players,
      winner,
      date: new Date().toISOString(),
      fixtureId: fixture.id,
    };
    saveMatch(match);
    updateTournamentFixture(fixture.id, { matchId: match.id });
    onSave();
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 space-y-3">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Who won?</p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { num: 1, team: t1, pids: t1Players },
          { num: 2, team: t2, pids: t2Players },
        ].map(({ num, team, pids }) => (
          <button
            key={num}
            type="button"
            onClick={() => setWinner(num)}
            className={`rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
              winner === num
                ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200 scale-105"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            {winner === num && <span className="mr-1">🏆</span>}
            <span className="font-semibold text-sm text-slate-700">{team?.name}</span>
            <div className="text-xs text-slate-400 mt-0.5">
              {pids.map((id) => playerName(id, players)).join(" & ")}
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!winner}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
        >
          Save Result
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TournamentPage() {
  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [activeFixture, setActiveFixture] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  function load() {
    const t = getTournament();
    const p = getPlayers();
    setTournament(t);
    setPlayers(p);

    if (t && p.length > 0) {
      // Build rankings from tournament matches only
      const allMatches = getMatches();
      const fixtureMatchIds = new Set(
        t.fixtures.filter((f) => f.matchId).map((f) => f.matchId)
      );
      const tournamentMatches = allMatches.filter((m) => fixtureMatchIds.has(m.id));

      // Only rank players involved in this tournament
      const involvedIds = new Set(t.teams.flatMap((tm) => tm.playerIds));
      const involvedPlayers = p.filter((pl) => involvedIds.has(pl.id));
      setRankings(computeRankings(involvedPlayers, tournamentMatches));
    }
  }

  useEffect(() => { load(); }, []);

  function handleResultSaved() {
    setActiveFixture(null);
    load();
  }

  function handleReRandomize(fixtureId) {
    const t = getTournament();
    if (!t) return;
    const updated = randomizeFixturePlayers(
      t.fixtures.filter((f) => f.id === fixtureId),
      t.teams
    );
    t.fixtures = t.fixtures.map((f) =>
      f.id === fixtureId ? { ...f, ...updated[0] } : f
    );
    saveTournament(t);
    load();
  }

  function handleClearTournament() {
    clearTournament();
    setTournament(null);
    setRankings([]);
    setConfirmClear(false);
  }

  if (!tournament) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📋</div>
        <h1 className="text-2xl font-bold text-slate-700 mb-2">No Active Tournament</h1>
        <p className="text-slate-400 mb-6">Set up a tournament to see the fixture list here.</p>
        <Link
          href="/schedule"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl"
        >
          Create a Schedule →
        </Link>
      </div>
    );
  }

  const played = tournament.fixtures.filter((f) => f.matchId).length;
  const total = tournament.fixtures.length;
  const pct = total > 0 ? Math.round((played / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">🏟 Tournament</h1>
          <p className="text-slate-500 mt-1">
            {tournament.teams.length} teams · {played}/{total} matches played
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-sm text-red-400 hover:text-red-600 underline"
            >
              Clear
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearTournament}
                className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
              >
                Yes, clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-sm bg-slate-200 px-3 py-1 rounded-lg text-slate-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {tournament.status === "completed" && (
          <p className="text-center text-sm font-semibold text-brand-700 mt-2">
            🎉 Tournament complete!
          </p>
        )}
      </div>

      {/* Fixtures */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3">Fixtures</h2>
        <div className="space-y-2">
          {tournament.fixtures.map((fix) => {
            const t1 = tournament.teams.find((t) => t.id === fix.team1Id);
            const t2 = tournament.teams.find((t) => t.id === fix.team2Id);
            const t1Pids = fix.team1PlayerIds ?? t1?.playerIds ?? [];
            const t2Pids = fix.team2PlayerIds ?? t2?.playerIds ?? [];
            const isPlayed = !!fix.matchId;
            const isActive = activeFixture === fix.id;

            return (
              <div
                key={fix.id}
                className={`bg-white border rounded-xl px-4 py-3 ${
                  isPlayed ? "border-brand-200 bg-brand-50" : "border-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Match number */}
                  <span className="text-xs text-slate-400 w-5 flex-shrink-0 text-right">
                    {fix.order}
                  </span>

                  {/* Teams */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TeamChip
                        team={t1}
                        pids={t1Pids}
                        players={players}
                        won={isPlayed}
                        // We need to check which team won from matches
                        // We'll just show all as neutral if played
                      />
                      <span className="text-xs text-slate-400 font-bold">vs</span>
                      <TeamChip
                        team={t2}
                        pids={t2Pids}
                        players={players}
                        won={false}
                      />
                    </div>
                  </div>

                  {/* Status / Action */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {isPlayed ? (
                      <MatchResult fix={fix} tournament={tournament} players={players} />
                    ) : (
                      <div className="flex items-center gap-1">
                        {tournament.randomizeBetweenMatches && (
                          <button
                            onClick={() => handleReRandomize(fix.id)}
                            title="Re-randomize players"
                            className="text-slate-400 hover:text-brand-600 text-sm px-2 py-1 rounded-lg hover:bg-brand-50 transition-colors"
                          >
                            🔀
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setActiveFixture(isActive ? null : fix.id)
                          }
                          className="text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {isActive ? "Cancel" : "Record"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline result recorder */}
                {isActive && !isPlayed && (
                  <RecordResult
                    fixture={fix}
                    tournament={tournament}
                    players={players}
                    onSave={handleResultSaved}
                    onCancel={() => setActiveFixture(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini rankings */}
      {rankings.length > 0 && played > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3">Current Standings</h2>
          <div className="space-y-1.5">
            {rankings.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5"
              >
                <span className="text-base w-6 text-center">
                  {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                </span>
                <span className="flex-1 text-sm font-medium text-slate-700 truncate">{r.name}</span>
                <span className="text-sm text-slate-400">{r.wins}W/{r.losses}L</span>
                <span className="font-bold text-brand-700 w-8 text-right">{r.points}pts</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2 text-right">
            <Link href="/" className="underline hover:text-slate-600">Full rankings →</Link>
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function TeamChip({ team, pids, players }) {
  if (!team) return null;
  return (
    <span className="text-xs bg-slate-100 text-slate-600 rounded-lg px-2 py-1">
      <span className="font-semibold">{team.name}</span>
      {pids.length > 0 && (
        <span className="text-slate-400 ml-1">
          ({pids.map((id) => playerName(id, players)).join(" & ")})
        </span>
      )}
    </span>
  );
}

function MatchResult({ fix, tournament, players }) {
  const match = getMatches().find((m) => m.id === fix.matchId);
  if (!match) return <span className="text-xs text-slate-400">✓</span>;

  const winnerTeamId = match.winner === 1 ? fix.team1Id : fix.team2Id;
  const winnerTeam = tournament.teams.find((t) => t.id === winnerTeamId);
  return (
    <span className="text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-lg px-2 py-1">
      🏆 {winnerTeam?.name ?? "?"}
    </span>
  );
}
