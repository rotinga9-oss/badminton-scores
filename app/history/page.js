"use client";
import { useEffect, useState } from "react";
import { getPlayers, getMatches, deleteMatch, clearAllMatches } from "@/lib/storage";
import Link from "next/link";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);

  function load() {
    setPlayers(getPlayers());
    setMatches([...getMatches()].reverse()); // newest first
  }

  useEffect(() => { load(); }, []);

  function getName(id) {
    return players.find((p) => p.id === id)?.name ?? id;
  }

  function handleDelete(matchId) {
    deleteMatch(matchId);
    load();
  }

  function handleClearAll() {
    clearAllMatches();
    setConfirmClear(false);
    load();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">📋 Match History</h1>
          <p className="text-slate-500 mt-1">
            {matches.length === 0
              ? "No matches recorded yet"
              : `${matches.length} match${matches.length !== 1 ? "es" : ""} recorded`}
          </p>
        </div>
        {matches.length > 0 && (
          <div>
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-sm text-red-500 hover:text-red-700 underline"
              >
                Clear all
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Are you sure?</span>
                <button
                  onClick={handleClearAll}
                  className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
                >
                  Yes, clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {matches.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="text-5xl mb-4">🏸</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No matches yet</h2>
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Record First Match
          </Link>
        </div>
      )}

      {/* Match list */}
      <div className="space-y-3">
        {matches.map((match, i) => {
          const team1Names = match.team1.map(getName);
          const team2Names = match.team2.map(getName);
          const winTeam = match.winner === 1 ? 1 : 2;

          return (
            <div
              key={match.id}
              className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Match details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Team 1 */}
                    <span className={`font-semibold text-sm px-3 py-1 rounded-full ${
                      winTeam === 1
                        ? "bg-brand-100 text-brand-700 ring-1 ring-brand-400"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {winTeam === 1 && "🏆 "}
                      {team1Names.join(" & ")}
                    </span>

                    <span className="text-slate-400 font-bold text-sm">vs</span>

                    {/* Team 2 */}
                    <span className={`font-semibold text-sm px-3 py-1 rounded-full ${
                      winTeam === 2
                        ? "bg-brand-100 text-brand-700 ring-1 ring-brand-400"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {winTeam === 2 && "🏆 "}
                      {team2Names.join(" & ")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1.5">{formatDate(match.date)}</p>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(match.id)}
                  title="Delete match"
                  className="text-slate-300 hover:text-red-400 transition-colors text-xl flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
