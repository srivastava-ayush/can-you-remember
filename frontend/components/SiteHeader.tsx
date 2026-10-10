"use client";

import Link from "next/link";
import { useState } from "react";
import AuthModal from "./AuthModal";
import { usePlayer } from "./PlayerProvider";

export default function SiteHeader() {
  const { playerName, authError, loginAsGuest, login, signup, logout } = usePlayer();
  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Can You Remember home">
          <span className="brand-mark">C<span>Y</span>R</span>
          <span className="brand-name">CAN YOU REMEMBER<span className="brand-dot">.</span></span>
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <Link href="/leaderboard" className="nav-link">Leaderboard <span>↗</span></Link>
          {playerName ? (
            <>
              <span className="player-pill"><span className="status-dot" />{playerName}</span>
              <button onClick={() => void logout()} className="nav-link cursor-pointer">Log out</button>
            </>
          ) : (
            <>
              <button onClick={() => void loginAsGuest().catch(() => undefined)} className="nav-link cursor-pointer">Play as guest</button>
              <button onClick={() => setAuthModal("login")} className="nav-link cursor-pointer">Log in</button>
              <button onClick={() => setAuthModal("signup")} className="header-button cursor-pointer">Sign up <span>↗</span></button>
            </>
          )}
        </nav>
      </header>
      {authError && !authModal && <p role="alert" className="feedback-wrong text-sm px-6 pt-3">{authError}</p>}
      {authModal && <AuthModal mode={authModal} onClose={() => setAuthModal(null)} onDone={async (name, password) => {
        if (authModal === "signup") await signup(name, password);
        else await login(name, password);
        setAuthModal(null);
      }} />}
    </>
  );
}
