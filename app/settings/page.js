"use client";
import { useEffect, useState } from "react";
import { getPlayers, savePlayers, getSport, saveSport, generateId } from "@/lib/storage";

export default function SettingsPage() {
  const [sport, setSport] = useState("");
  const [players, setPlayers] = useState([]);
  const [savedSport, setSavedSport] = useState(false);
  const [savedPlayers, setSavedPlayers] = useState(false);
  const [playerErrors, setPlayerErrors] = useState({});

  useEffect(() => {
    setSport(getSport() || "");
    setPlayers(getPlayers());
  }, []);

  // ── Sport name ────────────────────────────────────────────────────────────
  function handleSaveSport(e) {
    e.preventDefault();
    if (!sport.trim()) return;
    saveSport(sport.trim());
    setSavedSport(true);
    setTimeout(() => setSavedSport(false), 2500);
  }

  // ── Players ───────────────────────────────────────────────────────────────
  function handleNameChange(idx, val) {
    setPlayers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], name: val };
      return next;
    });
    setSavedPlayers(false);
    setPlayerErrors((prev) => { const n = { ...prev }; delete n[idx]; return n; });
  }

  function handleAddPlayer() {
    const newId = `player_${generateId()}`;
    setPlayers((prev) => [...prev, { id: newId, name: `Player ${prev.length + 1}` }]);
    setSavedPlayers(false);
  }

  function handleRemovePlayer(idx) {
    setPlayers((prev) => prev.filter((_, i) => i !== idx));
    setSavedPlayers(false);
    setPlayerErrors((prev) => {
      const n = {};
      Object.entries(prev).forEach(([k, v]) => {
        const ki = parseInt(k);
        if (ki < idx) n[ki] = v;
        else if (ki > idx) n[ki - 1] = v;
      });
      return n;
    });
  }

  function validatePlayers() {
    const errs = {};
    const names = players.map((p) => p.name.trim());
    names.forEach((n, i) => { if (!n) errs[i] = "Required"; });
    const seen = new Map();
    names.forEach((n, i) => {
      if (!errs[i]) {
        const lo = n.toLowerCase();
        if (seen.has(lo)) { errs[i] = "Duplicate"; errs[seen.get(lo)] = "Duplicate"; }
        else seen.set(lo, i);
      }
    });
    return errs;
  }

  function handleSavePlayers(e) {
    e.preventDefault();
    if (players.length === 0) return;
    const errs = validatePlayers();
    if (Object.keys(errs).length > 0) { setPlayerErrors(errs); return; }
    savePlayers(players.map((p) => ({ ...p, name: p.name.trim() })));
    setSavedPlayers(true);
    setTimeout(() => setSavedPlayers(false), 2500);
  }

  function handleResetPlayers() {
    const defaults = Array.from({ length: 8 }, (_, i) => ({
      id: `player_${i + 1}`,
      name: `Player ${i + 1}`,
    }));
    setPlayers(defaults);
    setPlayerErrors({});
    setSavedPlayers(false);
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">⚙️ Settings</h1>

      {/* ── Sport Name ── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-slate-700 mb-4">Sport Name</h2>
        {savedSport && (
          <div className="mb-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2 text-sm font-medium">
            ✅ Sport name saved!
          </div>
        )}
        <form onSubmit={handleSaveSport} className="flex gap-3">
          <input
            type="text"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            placeholder="e.g. Badminton, Table Tennis…"
            maxLength={40}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={!sport.trim()}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Save
          </button>
        </form>
      </section>

      {/* ── Players ── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-700">
            Players{" "}
            <span className="text-slate-400 font-normal text-sm">({players.length})</span>
          </h2>
          <button
            type="button"
            onClick={handleResetPlayers}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Reset to 8 defaults
          </button>
        </div>

        {savedPlayers && (
          <div className="mb-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2 text-sm font-medium">
            ✅ Players saved!
          </div>
        )}

        <form onSubmit={handleSavePlayers} className="space-y-4">
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {players.map((player, idx) => (
              <div key={player.id} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-5 text-right flex-shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handleNameChange(idx, e.target.value)}
                  maxLength={32}
                  placeholder={`Player ${idx + 1}`}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                    playerErrors[idx] ? "border-red-400 bg-red-50" : "border-slate-200"
                  }`}
                />
                {players.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(idx)}
                    className="text-slate-300 hover:text-red-400 text-xl leading-none flex-shrink-0"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddPlayer}
            className="w-full border border-dashed border-slate-300 rounded-xl py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
          >
            + Add player
          </button>

          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl transition-colors"
          >
            Save Players
          </button>
        </form>

        <p className="mt-3 text-xs text-slate-400">
          Player IDs are stable — renaming them updates everywhere automatically.
        </p>
      </section>
    </div>
  );
}
