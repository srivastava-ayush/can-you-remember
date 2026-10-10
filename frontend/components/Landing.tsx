"use client";

import Link from "next/link";
import { useEffect } from "react";
import SiteHeader from "./SiteHeader";

function Landing() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".site-shell");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    root.classList.add("motion-ready");

    let frame = 0;
    const updateScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--page-scroll", String(window.scrollY));
        root.style.setProperty("--art-drift", `${Math.min(window.scrollY, 900) * 0.045}px`);
        frame = 0;
      });
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <main className="site-shell">
      <SiteHeader />

      <div className="landing-content">
        <div className="eyebrow" data-reveal><span className="status-dot" /> THE MEMORY ARCADE <span className="eyebrow-line" /> VOL. 001</div>
        <section className="hero">
          <div className="hero-copy" data-reveal>
            <h1>How good is<br />your <em>memory?</em></h1>
            <p>Two simple games. One question. Put your short-term memory to the test, one round at a time.</p>
            <a href="#games" className="hero-cta">Explore the games <span>↘</span></a>
          </div>
          <div
            className="hero-art"
            data-reveal
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty("--cursor-x", `${event.clientX - rect.left}px`);
              event.currentTarget.style.setProperty("--cursor-y", `${event.clientY - rect.top}px`);
            }}
          >
            <Link href="/tile" className="hero-promo hero-promo-tile" aria-label="Play Tile Sequence">
              <div className="art-top" aria-hidden="true"><span>01 / VISUAL MEMORY</span><span>● LIVE</span></div>
              <div className="art-grid" aria-hidden="true">
                {Array.from({ length: 16 }).map((_, i) => <span key={i} className={i === 5 || i === 6 || i === 9 ? "lit" : ""} />)}
              </div>
              <div className="art-bottom" aria-hidden="true"><span>OBSERVE → RECALL → REPEAT</span><span>TILE SEQUENCE</span></div>
            </Link>
            <Link href="/number" className="hero-promo hero-promo-number" aria-label="Play Number Recall">
              <div className="art-top" aria-hidden="true"><span>02 / NUMERIC MEMORY</span><span>● LIVE</span></div>
              <div className="hero-number-display" aria-hidden="true">
                <span className="hero-number-label">SEQUENCE_02</span>
                <span className="hero-number-digits">8 4 2 6</span>
                <span className="hero-number-line" />
              </div>
              <div className="art-bottom" aria-hidden="true"><span>MEMORIZE → TYPE → ADVANCE</span><span>NUMBER RECALL</span></div>
            </Link>
            <span className="promo-cursor" aria-hidden="true">CLICK TO PLAY ↗</span>
          </div>
        </section>

        <section id="games" className="games-section">
          <div className="section-heading" data-reveal><div><span className="section-index">01 / SELECT A CHALLENGE</span><h2>Choose your game<span>.</span></h2></div><span className="section-aside">NO DOWNLOADS. JUST PLAY.</span></div>
          <div className="game-grid">
            <Link href="/tile" className="game-card group" data-reveal>
              <div className="game-card-top"><span>01 — VISUAL MEMORY</span><span className="card-arrow">↗</span></div>
              <div className="card-visual tile-visual" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /><span /><span /></div>
              <div className="card-content"><h3>Tile sequence</h3><p>Watch the pattern light up. Repeat it back. See how far your focus can take you.</p><span className="card-link">PLAY TILE GAME <span>→</span></span></div>
            </Link>
            <Link href="/number" className="game-card group" data-reveal>
              <div className="game-card-top"><span>02 — NUMERIC MEMORY</span><span className="card-arrow">↗</span></div>
              <div className="card-visual number-visual" aria-hidden="true"><span className="number-label">SEQUENCE_</span><span className="number-digits">8 4 2 6</span><span className="number-cursor" /></div>
              <div className="card-content"><h3>Number recall</h3><p>A number flashes on screen. Remember it before time runs out and type it back.</p><span className="card-link">PLAY NUMBER GAME <span>→</span></span></div>
            </Link>
          </div>
        </section>
      </div>
      <footer className="site-footer"><span>© 2026 CAN YOU REMEMBER?</span><span>MADE FOR CURIOUS MINDS <span className="footer-star">✳</span></span></footer>

    </main>
  );
}

export default Landing;
