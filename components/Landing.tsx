"use client";

import Link from "next/link";
import { useState } from "react";
import AuthModal from "./AuthModal";
import { usePlayer } from "./PlayerProvider";

function Landing() {
  const { playerName, loginAsGuest, login, signup, logout } = usePlayer();
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);

  return (
    <div className="relative min-h-screen min-w-screen p-6 flex flex-col justify-center items-center gap-10 z-10">
      {/* ---------------- Auth bar ---------------- */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-3 z-20">
        {playerName ? (
          <div className="flex items-center gap-3">
            <span className="text-ink/75 text-sm">
              <span className="text-xp-blue font-bold">✓</span> {playerName}
            </span>
            <button
              onClick={logout}
              className="glass-btn font-arcade text-[0.6rem] px-3 py-2 rounded-lg cursor-pointer"
            >
              LOGOUT
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={loginAsGuest}
              className="glass-btn font-arcade text-[0.6rem] px-3 py-2 rounded-lg cursor-pointer"
            >
              GUEST
            </button>
            <button
              onClick={() => setAuthModal("login")}
              className="glass-btn font-arcade text-[0.6rem] px-3 py-2 rounded-lg cursor-pointer"
            >
              LOGIN
            </button>
            <button
              onClick={() => setAuthModal("signup")}
              className="xp-btn font-arcade text-[0.6rem] px-3 py-2"
            >
              SIGN UP
            </button>
          </>
        )}
      </div>

      <div className="text-center">
        <h1 className="neon-title text-2xl md:text-5xl leading-relaxed">
          CAN YOU
          <br />
          REMEMBER?
        </h1>
        <p className="mt-6 text-ink/75 font-arcade text-[0.6rem] md:text-xs tracking-widest">
          PICK A MEMORY GAME
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link
          href="/tile"
          className="hud-panel group p-8 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(41,182,207,0.35)] hover:border-aqua/70"
        >
          <span className="text-5xl">🎯</span>
          <span className="font-arcade text-lg text-ink group-hover:text-xp-blue transition-colors">
            TILE GAME
          </span>
          <span className="text-ink/60 text-sm text-center">
            Watch the tiles light up, then repeat the sequence.
            <br />
            Chain combos, don&apos;t lose your hearts.
          </span>
          <span className="mt-2 text-aqua font-arcade text-[0.6rem] tracking-widest transition-all">
            PLAY →
          </span>
        </Link>

        <Link
          href="/number"
          className="hud-panel group p-8 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(41,182,207,0.35)] hover:border-aqua/70"
        >
          <span className="text-5xl">🔢</span>
          <span className="font-arcade text-lg text-ink group-hover:text-xp-blue transition-colors">
            NUMBER GAME
          </span>
          <span className="text-ink/60 text-sm text-center">
            Remember the number sequence shown to you.
            <br />
            <span className="text-ink/40">Coming soon...</span>
          </span>
          <span className="mt-2 text-aqua font-arcade text-[0.6rem] tracking-widest transition-all">
            PLAY →
          </span>
        </Link>
      </div>

      <Link
        href="/leaderboard"
        className="glass-btn font-arcade text-xs px-6 py-3 rounded-lg cursor-pointer"
      >
        🏆 LEADERBOARD
      </Link>

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onDone={(name) => {
            if (authModal === "signup") signup(name);
            else login(name);
            setAuthModal(null);
          }}
        />
      )}
    </div>
  );
}

export default Landing;