"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayers, saveMatch, generateId } from "@/lib/storage";

export default function RecordMatchPage() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [team1, setTeam1] = useState([null, null]);
  const [team2, setTeam2] = useState([null, null]);
  const [winner, setWinner] = useState(null); // 1 | 2
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPlayers(getPlayers());
  }, []);

  // All selected player ids (to prevent same player in multiple slots)
  const selectedIds = [...team1, ...team2].filter(Boolean);

  function availableFor(slotTeam, slotIndex) {
    const currentVal = slotTeam === 1 ? team1[slotIndex] : team2[slotIndex];
    return players.filter(
      (p) => !selectedIds.includes(p.id) || p.id === currentVal
    );
  }

  function setSlot(teamNum, idx, value) {
    if (teamNum === 1) {
      setTeam1((prev) => {
        const next = [...prev];
        next[idx] = value || null;
        return next;
      });
    } else {
      setTeam2((prev) => {
        const next = [...prev];
        next[idx] = value || null;
        return next;
      });
    }
    setError("");
    setWinner(null);
  }

  const allSelected =
    team1.every(Boolean) && team2.every(Boolean);

  function handleSubmit(e) {
    e.preventDefault();
    if (!allSelected) {
      setError("Please select all 4 players.");
      return;
    }
    if (!winner) {
      setError("Please select which team won.");
      return;
    }

    const match = {
      id: generateId(),
      team1,
      team2,
      winner,
      date: new Date().toISOString(),
    };

    saveMatch(match);
    setSaved(true);

    // Reset form after short delay
    setTimeout(() => {
      setTeam1([null, null]);
      setTeam2([null, null]);
      setWinner(null);
      setSaved(false);
    }, 1800);
  }

  const teamColors = {
    1: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", win: "bg-blue-600 text-white ring-blue-400" },
    2: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", win: "bg-purple-600 text-white ring-purple-400" },
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">🏸 Record Match</h1>
        <p className="text-slate-500 mt-1">
          Pick 4 players, assign them to teams, then pick the winner.
        </p>
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-300 text-green-700 rounded-xl px-5 py-4 text-center font-semibold text-lg animate-pulse">
          ✅ Match saved!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Teams */}
        {[1, 2].map((teamNum) => {
          const c = teamColors[teamNum];
          const team = teamNum === 1 ? team1 : team2;
          return (
            <div key={teamNum} className={`${c.bg} border ${c.border} rounded-2xl p-5`}>
              <h2 className={`font-bold text-lg ${c.text} mb-3`}>
                Team {teamNum}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                      Player {idx + 1}
                    </label>
                    <select
                      value={team[idx] || ""}
                      onChange={(e) => setSlot(teamNum, idx, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">— Select player —</option>
                      {availableFor(teamNum, idx).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Winner selection */}
        {allSelected && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="font-bold text-lg text-slate-700 mb-3">Who won?</h2>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((teamNum) => {
                const c = teamColors[teamNum];
                const team = teamNum === 1 ? team1 : team2;
                const names = team.map(
                  (id) => players.find((p) => p.id === id)?.name ?? id
                );
                const isWinner = winner === teamNum;
                return (
                  <button
                    key={teamNum}
                    type="button"
                    onClick={() => { setWinner(teamNum); setError(""); }}
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                      isWinner
                        ? `${c.win} border-transparent ring-2 scale-105`
                        : `border-slate-200 bg-white text-slate-700 hover:border-slate-300`
                    }`}
                  >
                    {isWinner && <span className="mr-1">🏆</span>}
                    Team {teamNum}: {names.join(" & ")}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm font-medium">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!allSelected || !winner}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-base shadow"
        >
          Save Match
        </button>
      </form>
    </div>
  );
}
