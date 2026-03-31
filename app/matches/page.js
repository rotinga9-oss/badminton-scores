"use client";
import { useEffect, useState } from "react";
import { getPlayers, saveMatch, generateId } from "@/lib/storage";

export default function RecordMatchPage() {
  const [players, setPlayers] = useState([]);
  const [team1, setTeam1] = useState([null, null]);
  const [team2, setTeam2] = useState([null, null]);
  const [teamSize, setTeamSize] = useState(2);
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getPlayers();
    setPlayers(p);
  }, []);

  // Resize team arrays when team size changes
  useEffect(() => {
    setTeam1(Array(teamSize).fill(null));
    setTeam2(Array(teamSize).fill(null));
    setWinner(null);
  }, [teamSize]);

  const selectedIds = [...team1, ...team2].filter(Boolean);

  function availableFor(teamNum, idx) {
    const currentVal = teamNum === 1 ? team1[idx] : team2[idx];
    return players.filter(
      (p) => !selectedIds.includes(p.id) || p.id === currentVal
    );
  }

  function setSlot(teamNum, idx, value) {
    const setter = teamNum === 1 ? setTeam1 : setTeam2;
    setter((prev) => {
      const next = [...prev];
      next[idx] = value || null;
      return next;
    });
    setError("");
    setWinner(null);
  }

  const allSelected = team1.every(Boolean) && team2.every(Boolean);

  function handleSubmit(e) {
    e.preventDefault();
    if (!allSelected) { setError("Please select all players."); return; }
    if (!winner) { setError("Please select which team won."); return; }

    saveMatch({
      id: generateId(),
      team1,
      team2,
      winner,
      date: new Date().toISOString(),
    });

    setSaved(true);
    setTimeout(() => {
      setTeam1(Array(teamSize).fill(null));
      setTeam2(Array(teamSize).fill(null));
      setWinner(null);
      setSaved(false);
    }, 1800);
  }

  const TC = {
    1: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", win: "bg-blue-600 text-white" },
    2: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", win: "bg-purple-600 text-white" },
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">🏸 Record Match</h1>
        <p className="text-slate-500 mt-1">Quick match — no tournament needed.</p>
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-300 text-green-700 rounded-xl px-5 py-4 text-center font-semibold">
          ✅ Match saved!
        </div>
      )}

      {/* Team size selector */}
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Players per team:</span>
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setTeamSize(n)}
            className={`w-8 h-8 rounded-lg border text-sm font-semibold transition-colors ${
              teamSize === n
                ? "bg-brand-600 border-brand-600 text-white"
                : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {[1, 2].map((teamNum) => {
          const c = TC[teamNum];
          const team = teamNum === 1 ? team1 : team2;
          return (
            <div key={teamNum} className={`${c.bg} border ${c.border} rounded-2xl p-5`}>
              <h2 className={`font-bold text-lg ${c.text} mb-3`}>Team {teamNum}</h2>
              <div className={`grid gap-3 ${teamSize > 2 ? "grid-cols-2" : "grid-cols-2"}`}>
                {Array.from({ length: teamSize }).map((_, idx) => (
                  <div key={idx}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Player {idx + 1}
                    </label>
                    <select
                      value={team[idx] || ""}
                      onChange={(e) => setSlot(teamNum, idx, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">— Select —</option>
                      {availableFor(teamNum, idx).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Winner */}
        {allSelected && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="font-bold text-lg text-slate-700 mb-3">Who won?</h2>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((teamNum) => {
                const c = TC[teamNum];
                const team = teamNum === 1 ? team1 : team2;
                const names = team.map((id) => players.find((p) => p.id === id)?.name ?? id);
                const isWin = winner === teamNum;
                return (
                  <button
                    key={teamNum}
                    type="button"
                    onClick={() => { setWinner(teamNum); setError(""); }}
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
                      isWin
                        ? `${c.win} border-transparent ring-2 scale-105`
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {isWin && <span className="mr-1">🏆</span>}
                    Team {teamNum}: {names.join(" & ")}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!allSelected || !winner}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow"
        >
          Save Match
        </button>
      </form>
    </div>
  );
}
