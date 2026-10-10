"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import AuthModal from "./AuthModal";
import { usePlayer } from "./PlayerProvider";
import SiteHeader from "./SiteHeader";

export default function GameAuthGate({ children }: { children: ReactNode }) {
  const { playerName, authLoading, loginAsGuest, login, signup } = usePlayer();
  const [mode, setMode] = useState<"login" | "signup" | null>(null);
  const [guestBusy, setGuestBusy] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  if (!authLoading && playerName) return <>{children}</>;

  const playAsGuest = async () => {
    setGuestBusy(true);
    setGuestError(null);
    try {
      await loginAsGuest();
    } catch (error) {
      setGuestError(error instanceof Error ? error.message : "Could not create a guest session.");
      setGuestBusy(false);
    }
  };

  return (
    <main className="site-shell">
      <SiteHeader />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <span className="section-index mb-5">THE MEMORY ARCADE / PLAYER ACCESS</span>
        {authLoading ? (
          <p className="font-arcade text-sm text-ink/60">RESTORING SESSION...</p>
        ) : (
          <div className="hud-panel w-full max-w-md px-8 py-10 flex flex-col items-center gap-5">
            <h1 className="neon-title text-3xl md:text-4xl">Ready to play?</h1>
            <p className="text-ink/60 text-sm leading-relaxed">Choose how you want to play. Your best scores will be saved to the leaderboard.</p>
            <button onClick={() => setMode("signup")} className="xp-btn font-arcade text-xs w-full py-3 cursor-pointer">CREATE ACCOUNT →</button>
            <button onClick={() => setMode("login")} className="glass-btn font-arcade text-xs w-full py-3 cursor-pointer">LOG IN</button>
            <div className="flex items-center gap-3 w-full text-ink/40 font-arcade text-xs"><span className="h-px bg-ink/15 flex-1" />OR<span className="h-px bg-ink/15 flex-1" /></div>
            <button onClick={() => void playAsGuest()} disabled={guestBusy} className="glass-btn font-arcade text-xs w-full py-3 cursor-pointer disabled:opacity-50">
              {guestBusy ? "CREATING GUEST..." : "PLAY AS GUEST ↗"}
            </button>
            <p className="text-ink/50 text-xs">We&apos;ll give you a unique guest name automatically.</p>
            {guestError && <p role="alert" className="feedback-wrong text-xs">{guestError}</p>}
          </div>
        )}
        <Link href="/" className="nav-link mt-6">← BACK TO ALL GAMES</Link>
      </div>
      {mode && <AuthModal mode={mode} onClose={() => setMode(null)} onDone={async (name, password) => {
        if (mode === "signup") await signup(name, password);
        else await login(name, password);
        setMode(null);
      }} />}
    </main>
  );
}
