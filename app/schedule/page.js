"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getPlayers,
  saveTournament,
  getTournament,
  generateId,
} from "@/lib/storage";
import {
  buildAutoSchedule,
  autoGenerateRoundRobin,
  randomizeMatchAssignments,
  shuffle,
} from "@/lib/schedule";

// ─── Mode tabs ────────────────────────────────────────────────────────────────
const MODES = [
  { id: "single", icon: "🏸", label: "Match by Match", desc: "Record one match at a time — no pre-set schedule." },
  { id: "auto",   icon: "🔄", label: "Auto Schedule",  desc: "Enter players & team size — round-robin is generated for you." },
  { id: "custom", icon: "⚙️", label: "Custom Schedule", desc: "Build each match from scratch: pick exactly who plays who in every game." },
];

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function Num({ label, value, min, max, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 font-bold">−</button>
        <span className="w-8 text-center font-semibold text-slate-800">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 font-bold">+</button>
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

// ─── Custom match row ─────────────────────────────────────────────────────────
// matchDef = { id, side1: [pid|null, ...], side2: [pid|null, ...] }
function CustomMatchRow({ matchDef, idx, total, players, onChangeSide, onDelete, onMove }) {
  // IDs already used in THIS match (prevents same player on both sides)
  const usedHere = [...matchDef.side1, ...matchDef.side2].filter(Boolean);

  function picker(side, slotIdx) {
    const currentVal = side === 1 ? matchDef.side1[slotIdx] : matchDef.side2[slotIdx];
    const available = players.filter(
      (p) => !usedHere.includes(p.id) || p.id === currentVal
    );
    return (
      <select
        key={slotIdx}
        value={currentVal || ""}
        onChange={(e) => onChangeSide(idx, side, slotIdx, e.target.value || null)}
        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-400"
      >
        <option value="">— player —</option>
        {available.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    );
  }

  const sideAComplete = matchDef.side1.every(Boolean);
  const sideBComplete = matchDef.side2.every(Boolean);

  return (
    <div className={`border rounded-xl p-3 transition-colors ${
      sideAComplete && sideBComplete
        ? "border-brand-200 bg-brand-50"
        : "border-slate-200 bg-white"
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-slate-500">Match {idx + 1}</span>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => onMove(idx, -1)} disabled={idx === 0}
            className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-base leading-none px-0.5">▲</button>
          <button type="button" onClick={() => onMove(idx, 1)} disabled={idx === total - 1}
            className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-base leading-none px-0.5">▼</button>
          <button type="button" onClick={() => onDelete(idx)}
            className="text-slate-300 hover:text-red-400 text-lg leading-none ml-1">×</button>
        </div>
      </div>

      {/* Two sides */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        {/* Side A */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-blue-600 mb-1">Side A</p>
          {matchDef.side1.map((_, i) => picker(1, i))}
        </div>

        <div className="flex items-center justify-center pt-6">
          <span className="text-xs font-bold text-slate-400">vs</span>
        </div>

        {/* Side B */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-purple-600 mb-1">Side B</p>
          {matchDef.side2.map((_, i) => picker(2, i))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const router = useRouter();
  const [mode, setMode] = useState("single");
  const [players, setPlayers] = useState([]);
  const [existingTournament, setExistingTournament] = useState(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  // ── Mode 2 ──
  const [autoNumPlayers, setAutoNumPlayers] = useState(8);
  const [autoTeamSize, setAutoTeamSize] = useState(2);
  const [autoRandomize, setAutoRandomize] = useState(true);

  // ── Mode 3 ──
  const [customSideSize, setCustomSideSize] = useState(2); // players per side
  const [matchDefs, setMatchDefs] = useState([]); // [{ id, side1: [], side2: [] }]

  useEffect(() => {
    const p = getPlayers();
    setPlayers(p);
    setExistingTournament(getTournament());
    // Seed 1 blank match when tab first opens
    setMatchDefs([blankMatch(2)]);
  }, []);

  function blankMatch(sideSize) {
    return {
      id: generateId(),
      side1: Array(sideSize).fill(null),
      side2: Array(sideSize).fill(null),
    };
  }

  // Resize existing match defs when sideSize changes
  function handleSideSizeChange(newSize) {
    setCustomSideSize(newSize);
    setMatchDefs((prev) =>
      prev.map((m) => ({
        ...m,
        side1: Array(newSize).fill(null).map((_, i) => m.side1[i] ?? null),
        side2: Array(newSize).fill(null).map((_, i) => m.side2[i] ?? null),
      }))
    );
  }

  // ── Mode 3 handlers ──
  function handleChangeSide(matchIdx, side, slotIdx, playerId) {
    setMatchDefs((prev) =>
      prev.map((m, i) => {
        if (i !== matchIdx) return m;
        const key = side === 1 ? "side1" : "side2";
        const arr = [...m[key]];
        arr[slotIdx] = playerId;
        return { ...m, [key]: arr };
      })
    );
  }

  function handleAddMatch() {
    setMatchDefs((prev) => [...prev, blankMatch(customSideSize)]);
  }

  function handleDeleteMatch(idx) {
    setMatchDefs((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleMoveMatch(idx, dir) {
    setMatchDefs((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function handleRandomizeMatchOrder() {
    setMatchDefs((prev) => shuffle([...prev]));
  }

  function handleRandomizeAllAssignments() {
    setMatchDefs((prev) => randomizeMatchAssignments(prev));
  }

  function handleAutoGenerate() {
    // Round-robin from all players, using customSideSize
    const generated = autoGenerateRoundRobin(players, customSideSize);
    setMatchDefs((prev) => [...prev, ...generated]);
  }

  function handleClearAll() {
    setMatchDefs([blankMatch(customSideSize)]);
  }

  // ── Computed (Mode 2) ──
  const autoNumTeams = Math.floor(autoNumPlayers / autoTeamSize);
  const autoPlayersNeeded = autoNumTeams * autoTeamSize;
  const autoMatchCount = (autoNumTeams * (autoNumTeams - 1)) / 2;

  // ── Mode 3 validation ──
  const completedMatches = matchDefs.filter(
    (m) => m.side1.every(Boolean) && m.side2.every(Boolean)
  );
  const hasAnyComplete = completedMatches.length > 0;

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
    // Only include fully-filled matches
    const fixtures = completedMatches.map((m, i) => ({
      id: generateId(),
      order: i + 1,
      team1Id: null,
      team2Id: null,
      team1PlayerIds: m.side1,
      team2PlayerIds: m.side2,
      matchId: null,
    }));
    createTournament({
      id: generateId(),
      createdAt: new Date().toISOString(),
      mode: "custom",
      teams: [],
      fixtures,
      randomizeBetweenMatches: false,
      status: "active",
    });
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">📅 Schedule Matches</h1>
        <p className="text-slate-500 mt-1">Choose how you want to run your matches.</p>
      </div>

      {existingTournament && existingTournament.status === "active" && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-700">
            ⚠️ There&apos;s an active tournament. Creating a new one will replace it.
          </p>
          <a href="/tournament" className="text-sm font-semibold text-amber-800 underline whitespace-nowrap">View it →</a>
        </div>
      )}

      {/* Mode tabs */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {MODES.map((m) => (
          <button key={m.id} onClick={() => { setMode(m.id); setConfirmReplace(false); }}
            className={`flex flex-col items-center gap-1 px-3 py-4 rounded-2xl border-2 transition-all text-center ${
              mode === m.id ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:border-slate-300"
            }`}>
            <span className="text-2xl">{m.icon}</span>
            <span className={`text-xs font-bold leading-tight ${mode === m.id ? "text-brand-700" : "text-slate-600"}`}>
              {m.label}
            </span>
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-500 mb-6">{MODES.find((m) => m.id === mode)?.desc}</p>

      {/* ── Mode 1: Match by Match ── */}
      {mode === "single" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4">
          <p className="text-slate-600">No tournament setup needed. Record individual matches on the fly.</p>
          <a href="/matches"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-3 rounded-xl transition-colors">
            Record a Match →
          </a>
        </div>
      )}

      {/* ── Mode 2: Auto Schedule ── */}
      {mode === "auto" && (
        <form onSubmit={handleAutoSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="flex gap-8">
              <Num label="Total players" value={autoNumPlayers} min={2} max={players.length} onChange={setAutoNumPlayers} />
              <Num label="Team size" value={autoTeamSize} min={1} max={Math.floor(autoNumPlayers / 2)} onChange={setAutoTeamSize} />
            </div>
            <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600">
              <p><strong>{autoNumTeams}</strong> teams of {autoTeamSize} · <strong>{autoMatchCount}</strong> round-robin matches</p>
              {players.length < autoPlayersNeeded && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠ Need {autoPlayersNeeded} players, have {players.length}.{" "}
                  <a href="/settings" className="underline">Add more →</a>
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
          <button type="submit" disabled={players.length < autoPlayersNeeded}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow">
            {confirmReplace ? "⚠ Confirm & Replace Tournament" : "Generate Schedule →"}
          </button>
        </form>
      )}

      {/* ── Mode 3: Custom Schedule ── */}
      {mode === "custom" && (
        <form onSubmit={handleCustomSubmit} className="space-y-5">

          {/* Global settings bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-end gap-6">
            <Num
              label="Players per side"
              value={customSideSize}
              min={1}
              max={Math.floor(players.length / 2)}
              onChange={handleSideSizeChange}
            />
            <div className="flex flex-wrap gap-2 ml-auto">
              <button type="button" onClick={handleAutoGenerate}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium whitespace-nowrap">
                🔁 Auto-fill round-robin
              </button>
              <button type="button" onClick={handleRandomizeMatchOrder}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium whitespace-nowrap">
                🔀 Shuffle order
              </button>
              <button type="button" onClick={handleRandomizeAllAssignments}
                className="text-xs px-3 py-2 rounded-lg border border-brand-200 hover:bg-brand-50 text-brand-600 font-medium whitespace-nowrap">
                🎲 Randomize players
              </button>
            </div>
          </div>

          {/* Match list */}
          <div className="space-y-3">
            {matchDefs.length === 0 && (
              <div className="text-center py-10 bg-white border border-dashed border-slate-300 rounded-2xl text-slate-400 text-sm">
                No matches yet. Hit &quot;+ Add match&quot; or &quot;Auto-fill round-robin&quot;.
              </div>
            )}
            {matchDefs.map((m, idx) => (
              <CustomMatchRow
                key={m.id}
                matchDef={m}
                idx={idx}
                total={matchDefs.length}
                players={players}
                onChangeSide={handleChangeSide}
                onDelete={handleDeleteMatch}
                onMove={handleMoveMatch}
              />
            ))}
          </div>

          {/* Footer toolbar */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleAddMatch}
              className="flex-1 border border-dashed border-slate-300 rounded-xl py-2.5 text-sm text-slate-500 hover:bg-slate-50 transition-colors">
              + Add match
            </button>
            {matchDefs.length > 1 && (
              <button type="button" onClick={handleClearAll}
                className="text-xs text-slate-400 hover:text-red-400 underline px-2 whitespace-nowrap">
                Clear all
              </button>
            )}
          </div>

          {/* Status summary */}
          {matchDefs.length > 0 && (
            <p className="text-xs text-slate-500 text-right">
              {completedMatches.length}/{matchDefs.length} match{matchDefs.length !== 1 ? "es" : ""} fully filled
              {matchDefs.length - completedMatches.length > 0 && (
                <span className="text-amber-500"> · {matchDefs.length - completedMatches.length} incomplete (will be skipped)</span>
              )}
            </p>
          )}

          {confirmReplace && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              ⚠ This will replace the current active tournament. Click again to confirm.
            </p>
          )}

          <button type="submit" disabled={!hasAnyComplete}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow">
            {confirmReplace ? "⚠ Confirm & Replace Tournament" : `Create Tournament (${completedMatches.length} match${completedMatches.length !== 1 ? "es" : ""}) →`}
          </button>
        </form>
      )}
    </div>
  );
}
