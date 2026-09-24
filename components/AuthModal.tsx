"use client";
import { useState } from "react";

type Props = {
  mode: "login" | "signup";
  onClose: () => void;
  onDone: (name: string, password: string) => void;
};

function AuthModal({ mode, onClose, onDone }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const isSignup = mode === "signup";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    onDone(name.trim(), password);
  };

  return (
    <aside className="absolute bg-[#ece4cd]/90 backdrop-blur-xl min-h-screen min-w-full top-0 left-0 z-40 flex items-center justify-center px-4 slide-overlay">
      <div className="hud-panel w-full max-w-sm px-8 py-8 flex flex-col items-center gap-6">
        <h2 className="font-arcade text-lg text-xp-blue">
          {isSignup ? "SIGN UP" : "LOGIN"}
        </h2>
        <p className="text-ink/60 text-xs text-center">
          Demo auth — no backend yet, anything works.
        </p>

        <form onSubmit={submit} className="w-full flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-ink/70 text-xs font-arcade">NAME</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a username"
              className="input-field"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-ink/70 text-xs font-arcade">PASSWORD</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "Choose a password" : "Your password"}
              className="input-field"
            />
          </label>

          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="xp-btn w-full py-3 font-arcade text-sm disabled:opacity-50 mt-2"
          >
            {isSignup ? "CREATE ACCOUNT" : "LOGIN"}
          </button>
        </form>

        <button
          onClick={onClose}
          className="text-ink/60 hover:text-ink underline underline-offset-4 text-xs font-arcade cursor-pointer"
        >
          ← BACK
        </button>
      </div>
    </aside>
  );
}

export default AuthModal;