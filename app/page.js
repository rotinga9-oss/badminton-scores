"use client";
import { useEffect, useState } from "react";
import { getPlayers, getMatches } from "@/lib/storage";
import { computeRankings } from "@/lib/rankings";
import Link from "next/link";

const MEDAL = ["🥇", "🥈", "🥉"];

function getRankBadge(rank) {
  if (rank <= 3) return MEDAL[rank - 1];
  return `#${rank}`;
}

function getRankColor(rank) {
  if (rank === 1) return "bg-yellow-50 border-yellow-300";
  if (rank === 2) return "bg-slate-50 border-slate-300";
  if (rank === 3) return "bg-orange-50 border-orange-200";
  return "bg-white border-slate-200";
}

export default function RankingsPage() {
  const [rankings, setRankings] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);

  useEffect(() => {
    const players = getPlayers();
    const matches = getMatches();
    setRankings(computeRankings(players, matches));
    setTotalMatches(matches.length);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">🏆 Player Rankings</h1>
          <p className="text-slate-500 mt-1">
            {totalMatches === 0
              ? "No matches recorded yet"
              : `Based on ${totalMatches} match${totalMatches !== 1 ? "es" : ""}`}
          </p>
        </div>
        <Link
          href="/matches"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors shadow"
        >
          <span className="text-lg">+</span> Record Match
        </Link>
      </div>

      {/* Empty state */}
      {totalMatches === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="text-6xl mb-4">🏸</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No matches yet</h2>
          <p className="text-slate-400 mb-6">
            Record your first match to see player rankings here.
          </p>
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Record First Match
          </Link>
        </div>
      )}

      {/* Rankings table */}
      {rankings.length > 0 && (
        <div className="space-y-3">
          {rankings.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-4 border rounded-xl px-5 py-4 shadow-sm ${getRankColor(player.rank)}`}
            >
              {/* Rank badge */}
              <div className="text-2xl w-10 text-center flex-shrink-0">
                {getRankBadge(player.rank)}
              </div>

              {/* Player name */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-lg truncate">{player.name}</p>
                <p className="text-sm text-slate-500">
                  {player.wins}W &nbsp;·&nbsp; {player.losses}L &nbsp;·&nbsp; {player.matches} played
                </p>
              </div>

              {/* Points */}
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
        <p>✅ Win = <strong>2 points</strong> per player &nbsp;·&nbsp; ❌ Loss = <strong>0 points</strong></p>
        <p className="mt-1">Ties broken by head-to-head wins between tied players.</p>
      </div>
    </div>
  );
}
