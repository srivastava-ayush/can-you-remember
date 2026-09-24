"use client";
import Link from "next/link";
import { useState } from "react";
import { demoLeaderboard, GameName } from "@/lib/leaderboardData";
import { usePlayer } from "./PlayerProvider";

const MEDALS = ["🥇", "🥈", "🥉"];

type Filter = "All" | GameName;

function Leaderboard() {
  const { playerName } = usePlayer();
  const [filter, setFilter] = useState<Filter>("All");

  const rows =
    filter === "All"
      ? demoLeaderboard
      : demoLeaderboard.filter((e) => e.game === filter);

  return (
    <div className="min-h-screen min-w-screen p-6 md:p-12 flex flex-col justify-center items-center gap-8 z-10">
      <div className="text-center">
        <h1 className="neon-title text-2xl md:text-4xl leading-relaxed">
          LEADERBOARD
        </h1>
        <p className="mt-5 inline-block bg-xp-blue/15 border border-xp-blue/40 text-xp-blue font-arcade text-[0.55rem] md:text-[0.6rem] px-3 py-1.5 rounded-full tracking-widest">
          DEMO DATA · BACKEND COMING SOON
        </p>
      </div>

      {playerName && (
        <p className="text-ink/75 text-sm">
          Playing as <span className="text-xp-blue font-bold">{playerName}</span>
        </p>
      )}

      <div className="flex justify-center gap-2">
        {(["All", "Tile", "Number"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`op-button text-[0.6rem] ${
              filter === f ? "active" : ""
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="hud-panel w-full max-w-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-ink/10 text-ink/60 font-arcade text-[0.55rem] tracking-wider">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">PLAYER</th>
              <th className="px-4 py-3">GAME</th>
              <th className="px-4 py-3 text-right">LEVEL</th>
              <th className="px-4 py-3 text-right">SCORE</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry, idx) => {
              const rowIndex = demoLeaderboard.findIndex(
                (e) => e.id === entry.id
              );
              const isMe =
                playerName !== null &&
                entry.name.toLowerCase() === playerName.toLowerCase();
              return (
                <tr
                  key={entry.id}
                  className={`border-b border-ink/10 last:border-0 ${
                    isMe
                      ? "bg-aqua/15"
                      : idx % 2
                      ? "bg-transparent"
                      : "bg-black/[0.04]"
                  }`}
                >
                  <td className="px-4 py-3 font-arcade text-sm">
                    {rowIndex < 3 ? (
                      <span title={`Rank ${rowIndex + 1}`}>{MEDALS[rowIndex]}</span>
                    ) : (
                      <span className="text-ink/60">{rowIndex + 1}</span>
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
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-[0.6rem] font-arcade px-2 py-1 rounded-md ${
                        entry.game === "Tile"
                          ? "bg-xp-blue/15 text-xp-blue"
                          : "bg-ink/10 text-ink/70"
                      }`}
                    >
                      {entry.game.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink/70">
                    {entry.level}
                  </td>
                  <td className="px-4 py-3 text-right font-lcd lcd-chip text-sm">{entry.score.toLocaleString()}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/60">
                  No entries yet.
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