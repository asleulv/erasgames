"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getGameSummaries } from "@/lib/games";

function getLum(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Card background: always use the team's primary color */
function cardBg(primary: string): string {
  return primary;
}

/** On light card backgrounds use dark text, on dark backgrounds use white */
function cardText(bgHex: string): string {
  return getLum(bgHex) > 0.40 ? "#101820" : "#ffffff";
}

/** Top-border accent: simply the other color of the two identity colors */
function cardAccent(primary: string, secondary: string, bg: string): string {
  return bg === primary ? secondary : primary;
}

export default function HomePage() {
  const games = getGameSummaries();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  return (
    <main className="home-page" style={{ position: "relative" }}>
      <button 
        className="theme-toggle" 
        onClick={toggleTheme} 
        aria-label="Toggle dark mode"
        data-umami-event="Toggle Theme"
        data-umami-event-page="homepage"
        style={{
          position: "absolute",
          top: "24px",
          right: "24px",
          background: "transparent",
          border: "1px solid var(--line)",
          padding: "6px 12px",
          borderRadius: "8px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.8rem",
          fontWeight: "bold",
          color: "var(--text-color)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.2s ease",
          zIndex: 10,
        }}
      >
        <span>{theme === 'light' ? '☾' : '☀'}</span>
        <span>{theme === 'light' ? 'DARK' : 'LIGHT'}</span>
      </button>

      <section className="home-hero">
        <div className="logo-container">
          <Image
            src={!mounted || theme === 'light' ? "/logo-dark.png" : "/logo-light.png"}
            alt="Eras Games"
            width={240}
            height={140}
            priority
          />
        </div>
        <h1>Simple, yet addictive timeline games.</h1>
        <p>
          Build streaks and impress your friends by putting stuff in the right chronological order.
        </p>
      </section>

      <section className="game-list" aria-label="Available games">
        {games.map((game) => (
          <Link
            className="game-link"
            href={game.sitePath}
            key={game.id}
            data-umami-event="Play Game"
            data-umami-event-game={game.id}
            style={
              (() => {
                const bg = cardBg(game.theme.primary);
                const isLight = getLum(bg) > 0.45;
                const bgEnd = isLight
                  ? `color-mix(in srgb, ${bg} 93%, #000000)` // soft silver-grey for white/light cards
                  : `color-mix(in srgb, ${bg} 82%, #000000)`; // deep rich gradient end for dark cards

                return {
                  "--game-primary": game.theme.primary,
                  "--game-secondary": game.theme.secondary,
                  "--game-card-bg": bg,
                  "--game-card-bg-end": bgEnd,
                  "--game-card-text": cardText(bg),
                  "--game-card-accent": cardAccent(game.theme.primary, game.theme.secondary, bg),
                } as React.CSSProperties;
              })()
            }
          >
            <div className="game-card-content">
              <span className="game-card-category">{game.category}</span>
              <h2>{game.title}</h2>
              <p>{game.description}</p>
            </div>
            <div className="game-card-action">
              <span>Play Now</span>
              <span className="arrow">&rarr;</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
