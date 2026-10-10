"use client";
import { useState } from "react";

type Props = {
  mode: "login" | "signup";
  onClose: () => void;
  onDone: (name: string, password: string) => Promise<void>;
};

function AuthModal({ mode, onClose, onDone }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || password.length < 8 || busy) return;
    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onDone(name.trim(), password);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not sign in.");
      setBusy(false);
    }
  };

  return (
    <aside className="fixed bg-[#f6f4ee]/95 backdrop-blur-xl min-h-screen min-w-full top-0 left-0 z-40 flex items-center justify-center px-4 slide-overlay">
      <div className="hud-panel w-full max-w-sm px-8 py-8 flex flex-col items-center gap-6">
        <h2 className="font-arcade text-lg text-xp-blue">
          {isSignup ? "SIGN UP" : "LOGIN"}
        </h2>
        <p className="text-ink/60 text-xs text-center">
          {isSignup ? "Create an account to save your scores." : "Welcome back. Your scores are waiting."}
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-password" className="text-ink/70 text-xs font-arcade">PASSWORD</label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                minLength={8}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "Choose a password" : "Your password"}
                className="input-field pr-18"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/60 hover:text-ink font-arcade text-xs cursor-pointer">
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {isSignup && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-confirm-password" className="text-ink/70 text-xs font-arcade">CONFIRM PASSWORD</label>
              <div className="relative">
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="input-field pr-18"
                  aria-invalid={confirmPassword.length > 0 && password !== confirmPassword}
                />
                <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmPassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/60 hover:text-ink font-arcade text-xs cursor-pointer">
                  {showConfirmPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword && <span className="feedback-wrong text-xs">Passwords do not match.</span>}
            </div>
          )}

          {error && <p role="alert" className="feedback-wrong text-xs">{error}</p>}
          <button
            type="submit"
            disabled={name.trim().length < 2 || password.length < 8 || (isSignup && password !== confirmPassword) || busy}
            className="xp-btn w-full py-3 font-arcade text-sm disabled:opacity-50 mt-2"
          >
            {busy ? "PLEASE WAIT..." : isSignup ? "CREATE ACCOUNT" : "LOGIN"}
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
