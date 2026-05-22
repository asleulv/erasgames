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

  const [randomGames, setRandomGames] = useState(games.slice(0, 10));
  const [todayScores, setTodayScores] = useState<Record<string, number>>({});

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

    // Shuffle random games client-side only
    const shuffled = [...games].sort(() => Math.random() - 0.5);
    setRandomGames(shuffled.slice(0, 10));

    // Fetch today's best scores
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/leaderboard/today?date=${today}`)
      .then(r => r.json())
      .then(data => { if (data.scores) setTodayScores(data.scores); })
      .catch(() => {});
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

      <section className="game-list-section">
        <div className="game-list-header">
          <h2 className="game-list-title">Football</h2>
          <p className="game-list-subtitle">Choose a club and place their signings in chronological order. One wrong answer ends your run.</p>
        </div>

        <div className="game-list" aria-label="Available games">
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
                return {
                  "--game-primary": game.theme.primary,
                  "--game-secondary": game.theme.secondary,
                  "--game-card-bg": bg,
                  "--game-card-text": cardText(bg),
                  "--game-card-accent": cardAccent(game.theme.primary, game.theme.secondary, bg),
                } as React.CSSProperties;
              })()
            }
          >
            <div className="game-card-meta">
              <span className="game-card-count">{game.itemCount} entries</span>
              {todayScores[game.id] !== undefined && (
                <span className="game-card-today">Today's best score: {todayScores[game.id]}</span>
              )}
            </div>
            <div className="game-card-content">
              <h2>{game.shortTitle ?? game.title}</h2>
            </div>
          </Link>
        ))}
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <Image
              src={!mounted || theme === 'light' ? "/logo-dark.png" : "/logo-light.png"}
              alt="Eras Games"
              width={120}
              height={70}
              style={{ marginBottom: "12px" }}
            />
            <p className="footer-brand-text">
              Simple, yet addictive timeline quiz games. Test your football and pop-culture knowledge by ordering events chronologically.
            </p>
          </div>
          
          <div className="footer-links-grid">
            <div className="footer-link-group">
              <h4 className="footer-group-title">Timelines</h4>
              {randomGames.map((game) => (
                <Link key={game.id} href={game.sitePath} className="footer-link">
                  {game.shortTitle ?? game.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Eras Games. All rights reserved.</p>
          <div className="norway-badge">
            We miss you Nuno 🐺
          </div>
        </div>
      </footer>
    </main>
  );
}
