"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getPlayers,
  ensurePlayers,
  saveTournament,
  getTournament,
  generateId,
} from "@/lib/storage";
import {
  buildAutoSchedule,
  buildCustomTeams,
  buildFixturesFromDefs,
  defaultFixtureDefs,
  randomizeFixturePlayers,
  shuffle,
} from "@/lib/schedule";

// ─── Mode tabs ────────────────────────────────────────────────────────────────
const MODES = [
  { id: "single",  icon: "🏸", label: "Match by Match",  desc: "Record one match at a time manually." },
  { id: "auto",    icon: "🔄", label: "Auto Schedule",   desc: "Enter players & team size — schedule is generated for you." },
  { id: "custom",  icon: "⚙️", label: "Custom Schedule", desc: "Define teams, players per team, and exact match order." },
];

// ─── Small helpers ─────────────────────────────────────────────────────────────
function Num({ label, value, min, max, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 font-bold"
        >−</button>
        <span className="w-8 text-center font-semibold text-slate-800">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 font-bold"
        >+</button>
      </div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <div className="relative flex-shrink-0 mt-0.5">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-10 h-6 rounded-full transition-colors ${checked ? "bg-brand-500" : "bg-slate-300"}`} />
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </label>
  );
}

// ─── Fixture Def Row (Mode 3) ──────────────────────────────────────────────────
function FixtureDefRow({ fix, idx, total, numTeams, onChange, onDelete, onMove }) {
  const teams = Array.from({ length: numTeams }, (_, i) => i);
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
      <span className="text-xs text-slate-400 w-5 text-right flex-shrink-0">{idx + 1}</span>
      <select
        value={fix.team1Idx}
        onChange={(e) => onChange(idx, "team1Idx", parseInt(e.target.value))}
        className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
      >
        {teams.map((ti) => (
          <option key={ti} value={ti} disabled={ti === fix.team2Idx}>
            Team {ti + 1}
          </option>
        ))}
      </select>
      <span className="text-xs font-bold text-slate-400">vs</span>
      <select
        value={fix.team2Idx}
        onChange={(e) => onChange(idx, "team2Idx", parseInt(e.target.value))}
        className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
      >
        {teams.map((ti) => (
          <option key={ti} value={ti} disabled={ti === fix.team1Idx}>
            Team {ti + 1}
          </option>
        ))}
      </select>
      {/* Up / Down */}
      <div className="flex flex-col gap-0.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => onMove(idx, -1)}
          disabled={idx === 0}
          className="text-slate-300 hover:text-slate-600 disabled:opacity-20 leading-none text-lg"
        >▲</button>
        <button
          type="button"
          onClick={() => onMove(idx, 1)}
          disabled={idx === total - 1}
          className="text-slate-300 hover:text-slate-600 disabled:opacity-20 leading-none text-lg"
        >▼</button>
      </div>
      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(idx)}
        className="text-slate-300 hover:text-red-400 text-xl leading-none flex-shrink-0"
      >×</button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const router = useRouter();
  const [mode, setMode] = useState("single");
  const [players, setPlayers] = useState([]);
  const [existingTournament, setExistingTournament] = useState(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  // ── Mode 2 state ──
  const [autoNumPlayers, setAutoNumPlayers] = useState(8);
  const [autoTeamSize, setAutoTeamSize] = useState(2);
  const [autoRandomize, setAutoRandomize] = useState(true);

  // ── Mode 3 state ──
  const [customNumTeams, setCustomNumTeams] = useState(4);
  const [customPerTeam, setCustomPerTeam] = useState(2);
  const [customRandomizePlayers, setCustomRandomizePlayers] = useState(false);
  const [customRandomizeBetweenMatches, setCustomRandomizeBetweenMatches] = useState(false);
  const [fixtureDefs, setFixtureDefs] = useState(() => defaultFixtureDefs(4));

  useEffect(() => {
    setPlayers(getPlayers());
    setExistingTournament(getTournament());
  }, []);

  // Regenerate fixture defs when numTeams changes (mode 3)
  useEffect(() => {
    if (mode === "custom") {
      setFixtureDefs(defaultFixtureDefs(customNumTeams));
    }
  }, [customNumTeams, mode]);

  // ── Computed ──
  const autoNumTeams = Math.floor(autoNumPlayers / autoTeamSize);
  const autoPlayersNeeded = autoNumTeams * autoTeamSize;
  const autoMatchCount = (autoNumTeams * (autoNumTeams - 1)) / 2;
  const customPlayersNeeded = customNumTeams * customPerTeam;
  const hasEnoughPlayers = (needed) => players.length >= needed;

  // ── Fixture Def handlers ──
  function handleFixtureChange(idx, field, val) {
    setFixtureDefs((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: val } : f)));
  }
  function handleFixtureDelete(idx) {
    setFixtureDefs((prev) => prev.filter((_, i) => i !== idx));
  }
  function handleFixtureMove(idx, dir) {
    setFixtureDefs((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }
  function handleAddFixture() {
    setFixtureDefs((prev) => [
      ...prev,
      { id: generateId(), team1Idx: 0, team2Idx: Math.min(1, customNumTeams - 1) },
    ]);
  }
  function handleRandomizeOrder() {
    setFixtureDefs((prev) => shuffle([...prev]).map((f) => ({ ...f })));
  }

  // ── Create tournament ──
  function createTournament(tournament) {
    const existing = getTournament();
    if (existing && existing.status === "active" && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    saveTournament(tournament);
    router.push("/tournament");
  }

  function handleAutoSubmit(e) {
    e.preventDefault();
    const usedPlayers = players.slice(0, autoPlayersNeeded);
    const { teams, fixtures } = buildAutoSchedule({
      players: usedPlayers,
      teamSize: autoTeamSize,
      randomize: autoRandomize,
    });
    createTournament({
      id: generateId(),
      createdAt: new Date().toISOString(),
      mode: "auto",
      teams,
      fixtures,
      randomizeBetweenMatches: false,
      status: "active",
    });
  }

  function handleCustomSubmit(e) {
    e.preventDefault();
    const usedPlayers = players.slice(0, customPlayersNeeded);
    const teams = buildCustomTeams({
      players: usedPlayers,
      numTeams: customNumTeams,
      playersPerTeam: customPerTeam,
      randomizePlayers: customRandomizePlayers,
    });
    let fixtures = buildFixturesFromDefs(fixtureDefs, teams);
    if (customRandomizeBetweenMatches) {
      fixtures = randomizeFixturePlayers(fixtures, teams);
    }
    createTournament({
      id: generateId(),
      createdAt: new Date().toISOString(),
      mode: "custom",
      teams,
      fixtures,
      randomizeBetweenMatches: customRandomizeBetweenMatches,
      status: "active",
    });
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">📅 Schedule Matches</h1>
        <p className="text-slate-500 mt-1">Choose how you want to run your matches.</p>
      </div>

      {/* Active tournament warning */}
      {existingTournament && existingTournament.status === "active" && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-700">
            ⚠️ There&apos;s an active tournament. Creating a new one will replace it.
          </p>
          <a href="/tournament" className="text-sm font-semibold text-amber-800 underline whitespace-nowrap">
            View it →
          </a>
        </div>
      )}

      {/* Mode tabs */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setConfirmReplace(false); }}
            className={`flex flex-col items-center gap-1 px-3 py-4 rounded-2xl border-2 transition-all text-center ${
              mode === m.id
                ? "border-brand-500 bg-brand-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <span className="text-2xl">{m.icon}</span>
            <span className={`text-xs font-bold leading-tight ${mode === m.id ? "text-brand-700" : "text-slate-600"}`}>
              {m.label}
            </span>
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-500 mb-6 -mt-2">
        {MODES.find((m) => m.id === mode)?.desc}
      </p>

      {/* ── Mode 1: Match by Match ── */}
      {mode === "single" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4">
          <p className="text-slate-600">
            No tournament setup needed. Go straight to recording individual matches.
          </p>
          <a
            href="/matches"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-3 rounded-xl transition-colors"
          >
            Record a Match →
          </a>
        </div>
      )}

      {/* ── Mode 2: Auto Schedule ── */}
      {mode === "auto" && (
        <form onSubmit={handleAutoSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="flex gap-8">
              <Num
                label="Total players"
                value={autoNumPlayers}
                min={2}
                max={players.length}
                onChange={setAutoNumPlayers}
              />
              <Num
                label="Team size"
                value={autoTeamSize}
                min={1}
                max={Math.floor(autoNumPlayers / 2)}
                onChange={setAutoTeamSize}
              />
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 space-y-0.5">
              <p>
                <strong>{autoNumTeams}</strong> teams of {autoTeamSize} ·{" "}
                <strong>{autoMatchCount}</strong> round-robin matches
              </p>
              {!hasEnoughPlayers(autoPlayersNeeded) && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠ You only have {players.length} players. Need {autoPlayersNeeded}. Add more in{" "}
                  <a href="/settings" className="underline">Settings</a>.
                </p>
              )}
            </div>

            <Toggle
              label="Randomize player assignment & match order"
              hint="Randomly shuffle who's on which team and the order matches are played."
              checked={autoRandomize}
              onChange={setAutoRandomize}
            />
          </div>

          {confirmReplace && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              ⚠ This will replace the current active tournament. Click again to confirm.
            </p>
          )}

          <button
            type="submit"
            disabled={!hasEnoughPlayers(autoPlayersNeeded)}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow"
          >
            {confirmReplace ? "⚠ Confirm & Replace Tournament" : "Generate Schedule →"}
          </button>
        </form>
      )}

      {/* ── Mode 3: Custom Schedule ── */}
      {mode === "custom" && (
        <form onSubmit={handleCustomSubmit} className="space-y-5">
          {/* Setup */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <h2 className="font-semibold text-slate-700">Team Setup</h2>
            <div className="flex gap-8">
              <Num label="Number of teams" value={customNumTeams} min={2} max={16} onChange={setCustomNumTeams} />
              <Num label="Players per team" value={customPerTeam} min={1} max={6} onChange={setCustomPerTeam} />
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 space-y-0.5">
              <p>
                Requires <strong>{customPlayersNeeded}</strong> players
                {players.length < customPlayersNeeded && (
                  <span className="text-red-500">
                    {" "}— you only have {players.length}.{" "}
                    <a href="/settings" className="underline">Add more →</a>
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-3">
              <Toggle
                label="Randomize player assignment"
                hint="Randomly distribute all players across teams."
                checked={customRandomizePlayers}
                onChange={setCustomRandomizePlayers}
              />
              <Toggle
                label="Randomize players between each match"
                hint="Before each match the players of both participating teams are re-shuffled between those two teams."
                checked={customRandomizeBetweenMatches}
                onChange={setCustomRandomizeBetweenMatches}
              />
            </div>
          </div>

          {/* Fixture editor */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">
                Match Order
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {fixtureDefs.length} match{fixtureDefs.length !== 1 ? "es" : ""}
                </span>
              </h2>
              <button
                type="button"
                onClick={handleRandomizeOrder}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium"
              >
                🔀 Randomize order
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {fixtureDefs.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No matches yet. Add one below.</p>
              )}
              {fixtureDefs.map((fix, idx) => (
                <FixtureDefRow
                  key={fix.id}
                  fix={fix}
                  idx={idx}
                  total={fixtureDefs.length}
                  numTeams={customNumTeams}
                  onChange={handleFixtureChange}
                  onDelete={handleFixtureDelete}
                  onMove={handleFixtureMove}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddFixture}
              className="w-full border border-dashed border-slate-300 rounded-xl py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
            >
              + Add match
            </button>
          </div>

          {confirmReplace && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              ⚠ This will replace the current active tournament. Click again to confirm.
            </p>
          )}

          <button
            type="submit"
            disabled={!hasEnoughPlayers(customPlayersNeeded) || fixtureDefs.length === 0}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow"
          >
            {confirmReplace ? "⚠ Confirm & Replace Tournament" : "Create Tournament →"}
          </button>
        </form>
      )}
    </div>
  );
}
