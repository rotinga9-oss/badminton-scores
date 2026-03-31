"use client";
import { useEffect, useState } from "react";
import { getPlayers, savePlayers } from "@/lib/storage";

export default function SettingsPage() {
  const [players, setPlayers] = useState([]);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setPlayers(getPlayers());
  }, []);

  function handleNameChange(index, value) {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: value };
      return next;
    });
    setSaved(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function validate() {
    const errs = {};
    const names = players.map((p) => p.name.trim());
    names.forEach((name, i) => {
      if (!name) errs[i] = "Name cannot be empty.";
    });
    // Duplicate check
    const seen = new Map();
    names.forEach((name, i) => {
      if (!errs[i]) {
        const lower = name.toLowerCase();
        if (seen.has(lower)) {
          errs[i] = "Duplicate name.";
          errs[seen.get(lower)] = "Duplicate name.";
        } else {
          seen.set(lower, i);
        }
      }
    });
    return errs;
  }

  function handleSave(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const trimmed = players.map((p) => ({ ...p, name: p.name.trim() }));
    savePlayers(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    const defaults = Array.from({ length: 8 }, (_, i) => ({
      id: `player_${i + 1}`,
      name: `Player ${i + 1}`,
    }));
    setPlayers(defaults);
    setErrors({});
    setSaved(false);
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">👥 Player Names</h1>
        <p className="text-slate-500 mt-1">
          Customise the names of all 8 players. Changes are saved to this browser.
        </p>
      </div>

      {saved && (
        <div className="mb-6 bg-green-50 border border-green-300 text-green-700 rounded-xl px-5 py-3 font-semibold">
          ✅ Player names saved!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-sm">
          {players.map((player, index) => (
            <div key={player.id} className="flex items-center gap-4 px-5 py-3">
              <span className="text-sm font-medium text-slate-400 w-6 text-right flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex-1">
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  maxLength={32}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    errors[index]
                      ? "border-red-400 bg-red-50"
                      : "border-slate-300"
                  }`}
                  placeholder={`Player ${index + 1}`}
                />
                {errors[index] && (
                  <p className="text-xs text-red-500 mt-0.5">{errors[index]}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow"
          >
            Save Names
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors text-sm font-medium"
          >
            Reset defaults
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
        <strong>Note:</strong> Renaming players updates the display everywhere, but match history
        is stored by player ID — so old matches will correctly show the updated names.
      </div>
    </div>
  );
}
