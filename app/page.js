"use client";
import { useEffect, useState } from "react";
import { getPlayers, getMatches, getSport } from "@/lib/storage";
import { computeRankings } from "@/lib/rankings";
import SportSetup from "@/components/SportSetup";
import Link from "next/link";

const MEDAL = ["🥇", "🥈", "🥉"];

function rankBadge(rank) {
  return rank <= 3 ? MEDAL[rank - 1] : `#${rank}`;
}
function rankCard(rank) {
  if (rank === 1) return "bg-yellow-50 border-yellow-300";
  if (rank === 2) return "bg-slate-50 border-slate-300";
  if (rank === 3) return "bg-orange-50 border-orange-200";
  return "bg-white border-slate-200";
}

export default function RankingsPage() {
  const [rankings, setRankings] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [sport, setSport] = useState(null);   // null = not loaded yet
  const [sportReady, setSportReady] = useState(false);

  function load() {
    const s = getSport();
    setSport(s);
    setSportReady(true);
    const players = getPlayers();
    const matches = getMatches();
    setRankings(computeRankings(players, matches));
    setTotalMatches(matches.length);
  }

  useEffect(() => { load(); }, []);

  // ── Show sport setup on first visit ──
  if (!sportReady) return null; // hydrating

  if (!sport) {
    return (
      <SportSetup
        onDone={(name) => {
          setSport(name);
          load();
        }}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">🏆 {sport} Rankings</h1>
          <p className="text-slate-500 mt-1">
            {totalMatches === 0
              ? "No matches recorded yet"
              : `Based on ${totalMatches} match${totalMatches !== 1 ? "es" : ""}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/schedule"
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors shadow text-sm"
          >
            📅 Schedule
          </Link>
          <Link
            href="/matches"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
          >
            + Match
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {totalMatches === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="text-6xl mb-4">🏸</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No matches yet</h2>
          <p className="text-slate-400 mb-6">
            Set up a tournament or record a quick match to see rankings.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              📅 Create Schedule
            </Link>
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              + Quick Match
            </Link>
          </div>
        </div>
      )}

      {/* Rankings */}
      {rankings.length > 0 && (
        <div className="space-y-3">
          {rankings.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-4 border rounded-xl px-5 py-4 shadow-sm ${rankCard(player.rank)}`}
            >
              <div className="text-2xl w-10 text-center flex-shrink-0">
                {rankBadge(player.rank)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-lg truncate">{player.name}</p>
                <p className="text-sm text-slate-500">
                  {player.wins}W · {player.losses}L · {player.matches} played
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-brand-700">{player.points}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wide">pts</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-500">
        <p className="font-medium text-slate-600 mb-1">Scoring rules</p>
        <p>✅ Win = <strong>2 points</strong> · ❌ Loss = <strong>0 points</strong> · Ties broken by head-to-head wins</p>
      </div>
    </div>
  );
}
