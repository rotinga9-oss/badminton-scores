"use client";
import { useState } from "react";
import { saveSport } from "@/lib/storage";

/**
 * Full-screen overlay shown on first visit asking the user to name their sport.
 * Props:
 *   onDone(sportName) - called when user submits
 */
export default function SportSetup({ onDone }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a sport name.");
      return;
    }
    saveSport(trimmed);
    onDone(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Welcome!</h1>
        <p className="text-slate-500 mb-6 text-sm">
          What sport are you tracking scores for?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="text"
            placeholder="e.g. Badminton, Table Tennis, Squash…"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            maxLength={40}
            className={`w-full rounded-xl border px-4 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              error ? "border-red-400 bg-red-50" : "border-slate-300"
            }`}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Let&apos;s go →
          </button>
        </form>
      </div>
    </div>
  );
}
