"use client";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const MAX_LIVES = 3;
const TILE_SOUNDS = 12;
const CLEAR_DELAY = 650;

const CONFETTI_COLORS = [
  "#ffd93b",
  "#ff595e",
  "#57c785",
  "#4fb0e0",
  "#59f3e0",
  "#c77dff",
];

type Popup = {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
};

// Deterministic seeded PRNG (pure) so confetti generation is render-safe.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/*  Confetti burst                                                     */
/* ------------------------------------------------------------------ */
function Confetti({ seed }: { seed: number }) {
  const pieces = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: 80 }, () => ({
      left: rand() * 100,
      duration: rand() * 1.6 + 2.2,
      delay: rand() * 0.6,
      color: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)],
      width: rand() * 6 + 6,
      height: rand() * 8 + 8,
      round: rand() > 0.7,
    }));
  }, [seed]);
  return (
    <div className="confetti-wrap" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.width,
            height: p.height,
            borderRadius: p.round ? "50%" : "2px",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main game                                                          */
/* ------------------------------------------------------------------ */
function TileGame() {
  const [level, setLevel] = useState(1);
  const [cols, setCols] = useState(3);
  const [randomArr, setRandomArr] = useState<number[]>([]);
  const [userInputArr, setUserInputArr] = useState<number[]>([]);
  const [clickable, setClickable] = useState(true);
  const [highscore, setHighscore] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [isPlaying, setIsPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [confettiKey, setConfettiKey] = useState(0);
  const [cleared, setCleared] = useState({
    active: false,
    level: 1,
    fading: false,
  });
  const [popups, setPopups] = useState<Popup[]>([]);

  const gridRef = useRef<HTMLDivElement>(null);
  const randomArrRef = useRef<number[]>([]);
  const popupIdRef = useRef(0);
  const levelRef = useRef(1);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const soundOnRef = useRef(true);
  const tileSounds = useRef<{ [key: number]: HTMLAudioElement }>({});
  const loseAudio = useRef<HTMLAudioElement | null>(null);
  const winAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  /* ------------------------------------------------------------------ */
  /*  Preload sounds                                                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    loseAudio.current = new Audio("/sfx/roundlose.mp3");
    winAudio.current = new Audio("/sfx/roundwin.mp3");
    for (let i = 1; i <= TILE_SOUNDS; i++) {
      tileSounds.current[i] = new Audio(`/sfx/${i}.mp3`);
      tileSounds.current[i].load();
    }
    return () => {
      tileSounds.current = {};
      loseAudio.current = null;
      winAudio.current = null;
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const generateRn = useCallback(
    () => Math.floor(Math.random() * (cols * cols)) + 1,
    [cols]
  );

  const playTileSound = (tileId: number, comboCount: number) => {
    if (!soundOn) return;
    const audio = tileSounds.current[((tileId - 1) % TILE_SOUNDS) + 1];
    if (audio) {
      audio.currentTime = 0;
      audio.playbackRate = 1 + comboCount * 0.05;
      audio.play().catch(() => undefined);
    }
  };

  const showPopup = (x: number, y: number, text: string, color: string) => {
    const id = ++popupIdRef.current;
    setPopups((prev) => [...prev, { id, x, y, text, color }]);
    setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== id)), 950);
  };

  const addTileClass = useCallback((tileId: number, cls: string, ms: number) => {
    const tile = document.getElementById(tileId.toString());
    if (!tile) return;
    tile.classList.remove(
      "flash",
      "win-animate",
      "lose-animate",
      "tap-green"
    );
    tile.classList.add(cls);
    setTimeout(() => tile.classList.remove(cls), ms);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Sequence animation                                                 */
  /* ------------------------------------------------------------------ */
  const animatePrevTiles = useCallback((): Promise<void> =>
    new Promise<void>((resolve) => {
      const arr = [...randomArrRef.current];
      const go = (i: number) => {
        if (i >= arr.length) return resolve();
        addTileClass(arr[i], "flash", 420);
        setTimeout(() => go(i + 1), 520);
      };
      go(0);
    }), [addTileClass]);

  const animateNextTile = useCallback((): Promise<void> =>
    new Promise<void>((resolve) => {
      let rn = generateRn();
      while (rn === randomArrRef.current[randomArrRef.current.length - 1]) {
        rn = generateRn();
      }
      const next = [...randomArrRef.current, rn];
      randomArrRef.current = next;
      setRandomArr(next);
      setTimeout(() => {
        addTileClass(rn, "flash", 460);
        setTimeout(resolve, 520);
      }, 420);
    }), [addTileClass, generateRn]);

  /* ------------------------------------------------------------------ */
  /*  New game                                                           */
  /* ------------------------------------------------------------------ */
  const startNewGame = () => {
    if (gameOver && score >= highscore && score > 0) setHighscore(score);
    document.body.classList.remove("shake-screen");
    setPopups([]);
    setConfettiKey(0);
    setCleared({ active: false, level: 1, fading: false });
    randomArrRef.current = [];
    setRandomArr([]);
    setUserInputArr([]);
    setScore(0);
    setLives(MAX_LIVES);
    setLevel(1);
    setCombo(0);
    setMaxCombo(0);
    setGameOver(false);
    setMenuOpen(false);
    setIsPlaying(true);
    setClickable(false);
    setTimeout(() => {
      animateNextTile().then(() => setClickable(true));
    }, 500);
  };

  const openMenu = () => {
    document.body.classList.remove("shake-screen");
    setCleared({ active: false, level: 1, fading: false });
    setIsPlaying(false);
    setGameOver(false);
    setMenuOpen(true);
  };

  /* ------------------------------------------------------------------ */
  /*  Handle tile click                                                  */
  /* ------------------------------------------------------------------ */
  const handleClickOnBlock = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!clickable || gameOver) return;
    const target = e.target as HTMLDivElement;
    if (!target || !target.id) return;

    const tileId = Number(target.id);
    const expected = randomArrRef.current[userInputArr.length];

    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Wrong tile
    if (expected === undefined || tileId !== expected) {
      target.classList.add("lose-animate");
      setTimeout(() => target.classList.remove("lose-animate"), 500);

      if (soundOn) loseAudio.current?.play().catch(() => undefined);
      document.body.classList.add("shake-screen");
      setTimeout(() => document.body.classList.remove("shake-screen"), 550);

      setCombo(0);
      setUserInputArr([]);

      const remaining = lives - 1;
      setLives(remaining);
      if (remaining <= 0) {
        setIsPlaying(false);
        setGameOver(true);
      }
      return;
    }

    // Correct tile
    playTileSound(tileId, combo);
    target.classList.add("tap-green", "press-pop");
    setTimeout(
      () => target.classList.remove("tap-green", "press-pop"),
      400
    );

    const newCombo = combo + 1;
    const points = 10 * newCombo;
    const newScore = score + points;
    setCombo(newCombo);
    setMaxCombo((m) => Math.max(m, newCombo));
    setScore(newScore);
    setHighscore((h) => Math.max(h, newScore));
    showPopup(cx, cy - 10, `+${points}`, "#139bc4");
    if (newCombo >= 3) {
      showPopup(cx, cy + 18, `x${newCombo}`, "#0a8ea8");
    }

    setUserInputArr((prev) => [...prev, tileId]);
  };

  /* ------------------------------------------------------------------ */
  /*  Level clear - fires when input length matches sequence             */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (
      userInputArr.length > 0 &&
      userInputArr.length === randomArr.length
    ) {
      const clearedLevel = levelRef.current;
      const bonus = clearedLevel * 20;
      const totalScore = scoreRef.current + bonus;
      setScore(totalScore);
      setHighscore((h) => Math.max(h, totalScore));
      setMaxCombo((m) => Math.max(m, comboRef.current));

      if (soundOnRef.current) winAudio.current?.play().catch(() => undefined);
      setConfettiKey((k) => k + 1);
      setLevel((prev) => prev + 1);
      setClickable(false);

      const showTimer = setTimeout(() => {
        setCleared({ active: true, level: clearedLevel, fading: false });
      }, CLEAR_DELAY);

      const fadeTimer = setTimeout(() => {
        setCleared((prev) => ({ ...prev, fading: true }));
      }, CLEAR_DELAY + 2200);

      const nextTimer = setTimeout(() => {
        setCleared({ active: false, level: 1, fading: false });
        setConfettiKey(0);
        setUserInputArr([]);
        animatePrevTiles().then(() => {
          animateNextTile().then(() => setClickable(true));
        });
      }, CLEAR_DELAY + 2900);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(fadeTimer);
        clearTimeout(nextTimer);
      };
    }
  }, [userInputArr, randomArr, animatePrevTiles, animateNextTile]);

  /* ------------------------------------------------------------------ */
  /*  Tile size by grid                                                  */
  /* ------------------------------------------------------------------ */
  const tileSize =
    cols === 3
      ? "w-20 h-20 md:w-24 md:h-24"
      : cols === 4
      ? "w-16 h-16 md:w-20 md:h-20"
      : "w-12 h-12 md:w-16 md:h-16";

  const progress =
    randomArr.length > 0
      ? `${Math.round((userInputArr.length / randomArr.length) * 100)}%`
      : "0%";

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div className="relative min-h-screen min-w-screen p-6 md:p-12 flex flex-col justify-center items-center gap-8 z-10">
      {confettiKey > 0 && <Confetti seed={confettiKey} />}

      {/* Floating score popups */}
      {popups.map((p) => (
        <div
          key={p.id}
          className="score-popup"
          style={{
            left: p.x,
            top: p.y,
            color: p.color,
            fontSize: "0.7rem",
          }}
        >
          {p.text}
        </div>
      ))}

      {/* ---------------- Level clear overlay ---------------- */}
      {cleared.active && (
        <div
          className={`clear-overlay ${cleared.fading ? "fading" : ""}`}
        >
          <div className="kicker">ROUND COMPLETE</div>
          <div className="big-text" aria-label={`Level ${cleared.level} cleared`}>
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

      {/* ---------------- HUD ---------------- */}
      <div className="hud-panel w-full max-w-2xl grid grid-cols-2 md:grid-cols-4 gap-3 px-5 py-4 items-center z-20">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[0.6rem] font-bold tracking-widest text-ink/70">
            SCORE
          </span>
          <span className="font-lcd lcd-chip text-base md:text-lg">
            {score}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[0.6rem] font-bold tracking-widest text-ink/70">
            LEVEL
          </span>
          <span className="font-lcd lcd-chip lcd-aqua text-base md:text-lg">
            {level}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[0.6rem] font-bold tracking-widest text-ink/70">
            HIGH SCORE
          </span>
          <span className="font-lcd lcd-chip text-base md:text-lg">
            {highscore}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[0.6rem] font-bold tracking-widest text-ink/70">
            LIVES
          </span>
          <div className="flex gap-1">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <span
                key={i}
                className={`heart ${i >= lives ? "lost" : ""} ${
                  i === lives - 1 && lives < MAX_LIVES ? "lose-pop" : ""
                }`}
              >
                ❤️
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- Combo + progress + controls ---------------- */}
      <div className="w-full max-w-2xl flex items-center gap-4 z-20">
        <div className="flex-1 min-w-0">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: progress }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[0.6rem] font-arcade text-ink/70">
            <span>
              {userInputArr.length}/{randomArr.length}
            </span>
            <span>
              {isPlaying && !clickable
                ? "WATCH THE SEQUENCE"
                : isPlaying
                ? "REPEAT THE SEQUENCE"
                : "READY"}
            </span>
          </div>
        </div>
        {combo >= 2 && (
          <div className="combo-badge text-sm md:text-lg whitespace-nowrap animate-pulse">
            ✦ {combo}x COMBO
          </div>
        )}
        <button
          onClick={() => setSoundOn((v) => !v)}
          title={soundOn ? "Mute" : "Unmute"}
          className="glass-btn rounded-lg w-11 h-11 flex items-center justify-center text-lg cursor-pointer shrink-0"
        >
          {soundOn ? "🔊" : "🔇"}
        </button>
        <button
          onClick={openMenu}
          className="glass-btn rounded-lg w-11 h-11 flex items-center justify-center text-lg cursor-pointer shrink-0"
        >
          ⚙️
        </button>
      </div>

      {/* ---------------- Grid ---------------- */}
      <div
        ref={gridRef}
        className="relative hud-panel keypad-well grid gap-2.5 p-3 md:p-5 place-items-center z-20"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          width: "min(90vw, max-content)",
        }}
      >
        {[...Array(cols * cols)].map((_, i) => (
          <div
            key={i + 1}
            id={(i + 1).toString()}
            onClick={handleClickOnBlock}
            className={`blocks rounded-tile ${tileSize} ${
              clickable && isPlaying && !gameOver ? "tile-ready" : ""
            }`}
          />
        ))}
      </div>

      {/* ---------------- Menu overlay ---------------- */}
      {menuOpen && (
        <aside className="absolute bg-[#ece4cd]/90 backdrop-blur-xl min-h-screen min-w-full top-0 left-0 z-40 flex flex-col items-center justify-center px-4 py-20 text-center slide-overlay">
          <h1 className="neon-title text-xl md:text-4xl leading-relaxed">
            CAN YOU
            <br />
            REMEMBER?
          </h1>
          <p className="mt-6 mb-2 text-ink/75 font-arcade text-[0.6rem] md:text-xs tracking-wide">
            WATCH THE TILES · REPEAT THE SEQUENCE
          </p>

          <div className="hud-panel mt-6 px-8 py-6 flex flex-col items-center gap-5">
            <div>
              <span className="text-ink/60 text-[0.6rem] font-arcade block mb-3">
                PICK YOUR GRID
              </span>
              <div className="flex justify-center">
                <button
                  className={`op-button ${cols === 3 ? "active" : ""}`}
                  onClick={() => setCols(3)}
                >
                  3x3
                </button>
                <button
                  className={`op-button ${cols === 4 ? "active" : ""}`}
                  onClick={() => setCols(4)}
                >
                  4x4
                </button>
                <button
                  className={`op-button ${cols === 5 ? "active" : ""}`}
                  onClick={() => setCols(5)}
                >
                  5x5
                </button>
              </div>
            </div>

            <div className="text-ink text-sm font-arcade">
              BEST:{" "}
              <span className="font-lcd lcd-chip text-base">{highscore}</span>
            </div>

            <button
              id="start-btn"
              onClick={startNewGame}
              className="xp-btn text-xl md:text-2xl font-arcade w-fit py-3 px-8"
            >
              ▶ START
            </button>
            <p className="text-ink/60 text-xs text-center max-w-xs">
              3 lives · chain combos for big points · one wrong tap costs a heart
            </p>
            <Link
              href="/"
              className="text-ink/60 hover:text-xp-blue underline underline-offset-4 text-xs font-arcade mt-2 no-underline"
            >
              ← ALL GAMES
            </Link>
          </div>
        </aside>
      )}

      {/* ---------------- Game over overlay ---------------- */}
      {gameOver && (
        <aside className="absolute bg-[#ece4cd]/92 backdrop-blur-xl min-h-screen min-w-full top-0 left-0 z-40 flex flex-col items-center justify-center px-4 text-center gameover-in">
          <h2 className="font-arcade text-3xl md:text-5xl text-glow-red">
            GAME OVER
          </h2>
          <div className="hud-panel mt-8 px-10 py-8 flex flex-col items-center gap-4">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <span className="text-[0.6rem] text-ink/70 font-arcade block mb-2">
                  SCORE
                </span>
                <span className="font-lcd lcd-chip text-lg">
                  {score}
                </span>
              </div>
              <div>
                <span className="text-[0.6rem] text-ink/70 font-arcade block mb-2">
                  LEVEL
                </span>
                <span className="font-lcd lcd-chip lcd-aqua text-lg">
                  {level}
                </span>
              </div>
              <div>
                <span className="text-[0.6rem] text-ink/70 font-arcade block mb-2">
                  BEST COMBO
                </span>
                <span className="font-lcd lcd-chip text-lg">
                  x{maxCombo}
                </span>
              </div>
            </div>
            {score >= highscore && score > 0 && (
              <div className="combo-badge text-sm animate-pulse mt-1">
                ★ NEW HIGH SCORE ★
              </div>
            )}
            <button
              onClick={startNewGame}
              className="xp-btn text-lg font-arcade w-fit py-3 px-8 mt-2"
            >
              ↻ PLAY AGAIN
            </button>
            <button
              onClick={openMenu}
              className="text-ink/60 hover:text-ink underline underline-offset-4 text-xs font-arcade cursor-pointer mt-1"
            >
              MENU
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

export default TileGame;