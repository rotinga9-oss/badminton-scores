"use client";
import { useEffect, useState } from "react";
import { getPlayers, getMatches, deleteMatch, clearAllMatches } from "@/lib/storage";
import Link from "next/link";

function fmt(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
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
    setMatches([...getMatches()].reverse());
  }

  useEffect(() => { load(); }, []);

  function name(id) {
    return players.find((p) => p.id === id)?.name ?? id;
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">📋 Match History</h1>
          <p className="text-slate-500 mt-1">
            {matches.length === 0 ? "No matches yet" : `${matches.length} match${matches.length !== 1 ? "es" : ""}`}
          </p>
        </div>
        {matches.length > 0 && (
          !confirmClear ? (
            <button onClick={() => setConfirmClear(true)} className="text-sm text-red-400 hover:text-red-600 underline">
              Clear all
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Sure?</span>
              <button onClick={() => { clearAllMatches(); setConfirmClear(false); load(); }}
                className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg">Yes</button>
              <button onClick={() => setConfirmClear(false)}
                className="text-sm bg-slate-200 px-3 py-1 rounded-lg text-slate-600">No</button>
            </div>
          )
        )}
      </div>

      {matches.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="text-5xl mb-4">🏸</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-4">No matches recorded yet</h2>
          <div className="flex gap-3 justify-center">
            <Link href="/schedule" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-lg">
              Create Schedule
            </Link>
            <Link href="/matches" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-5 py-2.5 rounded-lg">
              Quick Match
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {matches.map((match) => {
          const t1Names = match.team1.map(name);
          const t2Names = match.team2.map(name);
          const winTeam = match.winner;
          return (
            <div key={match.id} className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    winTeam === 1 ? "bg-brand-100 text-brand-700 ring-1 ring-brand-300" : "bg-slate-100 text-slate-400"
                  }`}>
                    {winTeam === 1 && "🏆 "}{t1Names.join(" & ")}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">vs</span>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    winTeam === 2 ? "bg-brand-100 text-brand-700 ring-1 ring-brand-300" : "bg-slate-100 text-slate-400"
                  }`}>
                    {winTeam === 2 && "🏆 "}{t2Names.join(" & ")}
                  </span>
                  {match.fixtureId && (
                    <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded">tournament</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{fmt(match.date)}</p>
              </div>
              <button
                onClick={() => { deleteMatch(match.id); load(); }}
                title="Delete"
                className="text-slate-300 hover:text-red-400 text-xl flex-shrink-0"
              >×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
