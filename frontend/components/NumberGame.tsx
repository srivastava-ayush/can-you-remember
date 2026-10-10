"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { usePlayer } from "./PlayerProvider";
import SiteHeader from "./SiteHeader";

const CLEAR_DELAY = 650;

const memorizeMs = (level: number) => 2500 + level * 500;

function NumberGame() {
  const [isGameOn, setIsGameOn] = useState(false);
  const [bestLevel, setBestLevel] = useState(1);

  if (isGameOn) return <Game onExit={() => setIsGameOn(false)} bestLevel={bestLevel} onNewBest={setBestLevel} />;

  return (
    <div className="relative min-h-screen min-w-screen p-6 flex flex-col justify-center items-center gap-8 z-10">
      <div className="absolute top-0 inset-x-0 z-20"><SiteHeader /></div>
      <div className="text-center">
        <span className="section-index block mb-5">02 / NUMERIC MEMORY</span>
        <h1 className="neon-title text-4xl md:text-6xl leading-relaxed">
          NUMBER
          <br />
          GAME
        </h1>
      </div>

      <div className="hud-panel px-10 py-8 flex flex-col items-center gap-4">
        <button
          onClick={() => setIsGameOn(true)}
          className="xp-btn font-arcade text-sm py-3 px-6"
        >
          START THE GAME →
        </button>
        <div className="text-ink text-sm font-arcade">
          BEST: <span className="font-lcd lcd-chip text-base">{bestLevel}</span>
        </div>
        <Link
          href="/"
          className="glass-btn font-arcade text-xs px-6 py-3 rounded-lg cursor-pointer no-underline"
        >
          ← ALL GAMES
        </Link>
      </div>
    </div>
  );
}

function generateSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * 10));
}

function Game({
  onExit,
  bestLevel,
  onNewBest,
}: {
  onExit: () => void;
  bestLevel: number;
  onNewBest: Dispatch<SetStateAction<number>>;
}) {
  const { submitScore, scoreError } = usePlayer();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [randomNumberSequence, setRandomNumberSequence] = useState<number[]>(
    () => generateSequence(2)
  );
  const [userInput, setUserInput] = useState("");
  const [phase, setPhase] = useState<"memorize" | "guess">("memorize");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [timeLeft, setTimeLeft] = useState(() => memorizeMs(1));
  const [cleared, setCleared] = useState({
    active: false,
    level: 1,
    fading: false,
  });
  const [gameOver, setGameOver] = useState(false);

  const statusRef = useRef(status);

  const winAudio = useRef<HTMLAudioElement | null>(null);
  const loseAudio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    winAudio.current = new Audio("/sfx/roundwin.mp3");
    loseAudio.current = new Audio("/sfx/roundlose.mp3");
    return () => {
      winAudio.current = null;
      loseAudio.current = null;
    };
  }, []);

  const sequenceLength = currentLevel + 1;
  const totalMs = memorizeMs(currentLevel);
  const showTimer =
    phase === "memorize" && status === "idle" && !gameOver && !cleared.active;

  const fail = () => {
    setStatus("wrong");
    loseAudio.current?.play().catch(() => undefined);
    document.body.classList.add("shake-screen");
    setTimeout(() => document.body.classList.remove("shake-screen"), 550);
    setTimeout(() => setGameOver(true), 1200);
  };

  useEffect(() => {
    statusRef.current = status;
  });

  useEffect(() => {
    if (showTimer === false) return;
    const end = Date.now() + totalMs;
    const id = setInterval(() => {
      if (statusRef.current !== "idle") return;
      const rem = end - Date.now();
      setTimeLeft(rem);
      if (rem <= 0) {
        clearInterval(id);
        setPhase("guess");
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase, currentLevel, showTimer, totalMs]);

  function startRound(level: number) {
    setCurrentLevel(level);
    setRandomNumberSequence(generateSequence(level + 1));
    setUserInput("");
    setStatus("idle");
    setPhase("memorize");
    setTimeLeft(memorizeMs(level));
    setCleared({ active: false, level: 1, fading: false });
  }

  const restart = () => {
    setGameOver(false);
    startRound(1);
  };

  const submit = () => {
    if (userInput === randomNumberSequence.join("")) {
      const next = currentLevel + 1;
      onNewBest((b) => Math.max(b, currentLevel));
      void submitScore("Number", currentLevel * 100, currentLevel);
      setStatus("correct");
      winAudio.current?.play().catch(() => undefined);

      setTimeout(() => {
        setCleared({ active: true, level: currentLevel, fading: false });
      }, CLEAR_DELAY);

      setTimeout(() => {
        setCleared((prev) => ({ ...prev, fading: true }));
      }, CLEAR_DELAY + 2000);

      setTimeout(() => {
        startRound(next);
      }, CLEAR_DELAY + 2700);
    } else {
      fail();
    }
  };

  return (
    <div className="game-stage relative min-h-screen min-w-screen p-6 flex flex-col justify-center items-center gap-6 z-10">
      {/* ---------------- Level clear overlay ---------------- */}
      {cleared.active && (
        <div className={`clear-overlay ${cleared.fading ? "fading" : ""}`}>
          <div className="kicker">ROUND COMPLETE</div>
          <div
            className="big-text"
            aria-label={`Level ${cleared.level} cleared`}
          >
            {`LEVEL ${cleared.level} CLEARED`
              .split("")
              .map((ch, i) => (
                <span key={i} style={{ animationDelay: `${i * 60}ms` }}>
                  {ch === " " ? "\u00A0" : ch}
                </span>
              ))}
          </div>
          <div className="accent-line" />
        </div>
      )}

      {/* ---------------- Game over overlay ---------------- */}
      {gameOver && (
        <aside className="absolute bg-[#f6f4ee]/95 backdrop-blur-xl min-h-screen min-w-full top-0 left-0 z-40 flex flex-col items-center justify-center px-4 text-center gameover-in">
          <h2 className="font-arcade text-3xl md:text-5xl text-glow-red">
            GAME OVER
          </h2>
          <div className="hud-panel mt-8 px-10 py-8 flex flex-col items-center gap-4">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className="text-[0.6rem] text-ink/70 font-arcade block mb-2">
                  LEVEL
                </span>
                <span className="font-lcd lcd-chip text-lg">{currentLevel}</span>
              </div>
              <div>
                <span className="text-[0.6rem] text-ink/70 font-arcade block mb-2">
                  BEST
                </span>
                <span className="font-lcd lcd-chip lcd-aqua text-lg">
                  {bestLevel}
                </span>
              </div>
            </div>
            {scoreError && <p role="alert" className="feedback-wrong text-xs">{scoreError}</p>}
            <button
              onClick={restart}
              className="xp-btn text-lg font-arcade w-fit py-3 px-8 mt-2"
            >
              ↻ PLAY AGAIN
            </button>
            <Link
              href="/leaderboard?game=Number"
              className="leaderboard-fire-btn font-arcade text-xs px-6 py-3 no-underline"
            >
              <span>VIEW LEADERBOARD ↗</span>
            </Link>
            <button
              onClick={onExit}
              className="text-ink/60 hover:text-ink underline underline-offset-4 text-xs font-arcade cursor-pointer mt-1"
            >
              MENU
            </button>
          </div>
        </aside>
      )}

      {/* ---------------- HUD ---------------- */}
      <h1 className="neon-title text-lg md:text-2xl leading-relaxed">
        NUMBER GAME
      </h1>

      <div className="hud-panel w-full max-w-sm px-8 py-6 flex flex-col items-center gap-5">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[0.6rem] font-bold tracking-widest text-ink/70 block mb-1">
              LEVEL
            </span>
            <span className="font-lcd lcd-chip lcd-aqua text-base">
              {currentLevel}
            </span>
          </div>
          <div>
            <span className="text-[0.6rem] font-bold tracking-widest text-ink/70 block mb-1">
              DIGITS
            </span>
            <span className="font-lcd lcd-chip text-base">{sequenceLength}</span>
          </div>
        </div>

        {/* Number display (standout bezel screen) */}
        <div key={`${currentLevel}-${phase}`} className="number-display cinematic-display">
          {phase === "memorize"
            ? randomNumberSequence.join("")
            : randomNumberSequence.map(() => "·").join("")}
        </div>

        {showTimer && (
          <div className="w-full flex flex-col items-center gap-1.5 px-2">
            <span className={`time-left ${timeLeft < 1000 ? "urgent" : ""}`}>
              ⏱ {Math.max(0, timeLeft / 1000).toFixed(1)}s LEFT
            </span>
            <div className="timer-track">
              <div
                className={`timer-fill ${timeLeft < 1000 ? "low" : ""}`}
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (timeLeft / totalMs) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {phase === "guess" && status === "idle" && !gameOver && (
          <>
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value.replace(/\D/g, ""))}
              placeholder="Type the sequence"
              className="input-field text-center font-lcd text-xl tracking-widest"
            />
            <button
              onClick={submit}
              className="xp-btn font-arcade text-sm py-3 px-6"
            >
              CHECK
            </button>
          </>
        )}

        <p className={`text-xs font-arcade ${status === "correct" ? "feedback-correct" : status === "wrong" ? "feedback-wrong" : "text-ink/70"}`}>
          {phase === "memorize"
            ? "MEMORIZE IT!"
            : status === "correct"
            ? "✔ CORRECT!"
            : status === "wrong"
            ? "✘ WRONG"
            : "TYPE THE SEQUENCE!"}
        </p>
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

export default NumberGame;
