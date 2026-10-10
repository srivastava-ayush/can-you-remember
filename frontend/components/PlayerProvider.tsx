"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { GameName } from "@/lib/leaderboardData";

type Player = { id: string; name: string; isGuest: boolean };
type PlayerContextType = {
  playerName: string | null;
  authLoading: boolean;
  authError: string | null;
  scoreError: string | null;
  loginAsGuest: () => Promise<void>;
  login: (name: string, password: string) => Promise<void>;
  signup: (name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  submitScore: (game: GameName, score: number, level: number) => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed. Please try again.");
  return body as T;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    request<{ player: Player | null }>("/me")
      .then(({ player }) => { if (active) setPlayer(player); })
      .catch(() => { if (active) setAuthError("Could not connect to the game server."); })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);

  const authenticate = async (path: string, body?: object) => {
    setAuthError(null);
    try {
      const result = await request<{ player: Player }>(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      setPlayer(result.player);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not sign in.");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await request("/auth/logout", { method: "POST" });
      setPlayer(null);
      setAuthError(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not log out.");
    }
  };

  const submitScore = useCallback(async (game: GameName, score: number, level: number) => {
    if (!player) return;
    setScoreError(null);
    try {
      await request("/scores", { method: "POST", body: JSON.stringify({ game, score, level }) });
    } catch (error) {
      setScoreError(error instanceof Error ? error.message : "Score could not be saved.");
    }
  }, [player]);

  return (
    <PlayerContext.Provider value={{
      playerName: player?.name ?? null,
      authLoading,
      authError,
      scoreError,
      loginAsGuest: () => authenticate("/auth/guest"),
      login: (name, password) => authenticate("/auth/login", { name, password }),
      signup: (name, password) => authenticate("/auth/signup", { name, password }),
      logout,
      submitScore,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextType {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
