"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "cyr_player";
const CHANGE_EVENT = "cyr-player-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

function emitChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

type PlayerContextType = {
  playerName: string | null;
  loginAsGuest: () => void;
  login: (name: string) => void;
  signup: (name: string) => void;
  logout: () => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const playerName = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const persist = (name: string) => {
    window.localStorage.setItem(STORAGE_KEY, name);
    emitChange();
  };

  const loginAsGuest = () => persist("Guest");
  const login = (name: string) => persist(name || "Player");
  const signup = (name: string) => persist(name);
  const logout = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    emitChange();
  };

  return (
    <PlayerContext.Provider
      value={{ playerName, loginAsGuest, login, signup, logout }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextType {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}