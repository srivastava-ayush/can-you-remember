"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type GameName, type LeaderboardEntry } from "@/lib/leaderboardData";
import { usePlayer } from "./PlayerProvider";

const MEDALS = ["01", "02", "03"];

type Period = "all" | "weekly";

function Leaderboard({ initialGame = "Tile" }: { initialGame?: GameName }) {
  const { playerName } = usePlayer();
  const [game, setGame] = useState<GameName>(initialGame);
  const [period, setPeriod] = useState<Period>("all");
  const [result, setResult] = useState<{ key: string; entries: LeaderboardEntry[]; error: string | null }>({ key: "", entries: [], error: null });
  const queryKey = `${game}:${period}`;
  const loading = result.key !== queryKey;
  const rows = loading ? [] : result.entries;
  const error = loading ? null : result.error;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/leaderboard?game=${game}&period=${period}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load rankings.");
        return response.json();
      })
      .then((data: { entries: LeaderboardEntry[] }) => {
        if (!controller.signal.aborted) setResult({ key: queryKey, entries: data.entries, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ key: queryKey, entries: [], error: error.message });
      });
    return () => controller.abort();
  }, [game, period, queryKey]);

  return (
    <div className="min-h-screen min-w-screen p-6 md:p-12 flex flex-col justify-center items-center gap-8 z-10">
      <div className="text-center">
        <span className="section-index block mb-5">THE MEMORY ARCADE / RANKINGS</span>
        <h1 className="neon-title text-4xl md:text-6xl leading-relaxed">
          LEADERBOARD
        </h1>
        <p className="mt-5 inline-block bg-[#e9e5da] border border-[#d8d3c7] text-ink font-arcade text-[0.55rem] md:text-[0.6rem] px-3 py-1.5 tracking-widest">
          LIVE RANKINGS · {period === "weekly" ? "CURRENT UTC WEEK" : "ALL TIME"}
        </p>
      </div>

      {playerName && (
        <p className="text-ink/75 text-sm">
          Playing as <span className="text-xp-blue font-bold">{playerName}</span>
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-2xl border-b border-ink/15 pb-5">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <span className="section-index">CHOOSE GAME</span>
          <div className="flex" aria-label="Game rankings">
            {(["Tile", "Number"] as GameName[]).map((value) => (
              <button key={value} type="button" onClick={() => setGame(value)} aria-pressed={game === value} className={`op-button text-[0.6rem] ${game === value ? "active" : ""}`}>
                {value.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-2">
          <span className="section-index">TIME FRAME</span>
          <div className="flex" aria-label="Ranking period">
            {(["all", "weekly"] as Period[]).map((value) => (
              <button key={value} type="button" onClick={() => setPeriod(value)} aria-pressed={period === value} className={`op-button text-[0.6rem] ${period === value ? "active" : ""}`}>
                {value === "all" ? "ALL TIME" : "THIS WEEK"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hud-panel w-full max-w-2xl overflow-x-auto">
        <table className="w-full min-w-[420px] text-left">
          <thead>
            <tr className="border-b border-ink/10 text-ink/60 font-arcade text-[0.55rem] tracking-wider">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">PLAYER</th>
              <th className="px-4 py-3 text-right">LEVEL</th>
              <th className="px-4 py-3 text-right">SCORE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry, idx) => {
              const isMe =
                playerName !== null &&
                entry.name.toLowerCase() === playerName.toLowerCase();
              return (
                <tr
                  key={entry.id}
                  className={`border-b border-ink/10 last:border-0 ${
                    isMe
                      ? "bg-[#e9e5da]"
                      : idx % 2
                      ? "bg-transparent"
                      : "bg-black/[0.04]"
                  }`}
                >
                  <td className="px-4 py-3 font-arcade text-sm">
                    {idx < 3 ? (
                      <span title={`Rank ${idx + 1}`}>{MEDALS[idx]}</span>
                    ) : (
                      <span className="text-ink/60">{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold ${
                        isMe ? "text-xp-blue" : "text-ink"
                      }`}
                    >
                      {entry.name}
                      {isMe && <span className="text-xp-blue text-xs"> (you)</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink/70">
                    {entry.level}
                  </td>
                  <td className="px-4 py-3 text-right font-lcd lcd-chip text-sm">{entry.score.toLocaleString()}</td>
                </tr>
              );
            })}
            {(loading || error || rows.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink/60">
                  {loading ? "Loading rankings..." : error ?? `No ${period === "weekly" ? "scores this week" : "scores yet"} for ${game.toLowerCase()}. Be the first to play.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Link
        href="/"
        className="glass-btn font-arcade text-xs px-6 py-3 rounded-lg cursor-pointer no-underline"
      >
        ← ALL GAMES
      </Link>
    </div>
  );
}

export default Leaderboard;
