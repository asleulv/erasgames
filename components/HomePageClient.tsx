"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { PublicGameSummary } from "@/lib/timeline-types";

function getLum(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function cardBg(primary: string): string {
  return primary;
}

function cardText(bgHex: string): string {
  return getLum(bgHex) > 0.60 ? "#101820" : "#ffffff";
}

function cardAccent(primary: string, secondary: string, bg: string): string {
  return bg === primary ? secondary : primary;
}

function getSubcategoryDescription(subcategory: string): string {
  switch (subcategory.toLowerCase()) {
    case "player-transfers":
    case "player transfers":
    case "transfers":
      return "Place famous club signings in chronological order.";
    case "managers":
      return "Place legendary club managers in the order of their appointment.";
    case "trophies":
      return "Place iconic trophy wins and club milestones in chronological order.";
    case "club foundations":
    case "foundations":
      return "Place the foundation years of historic football clubs in chronological order.";
    case "marvel":
    case "mcu":
      return "Place Marvel Cinematic Universe movie releases in the correct chronological order.";
    case "classics":
    case "movies":
    case "movie classics":
      return "Place legendary, universally acclaimed movies in their correct release order.";
    case "tv shows":
    case "tv series":
    case "tv classics":
      return "Place iconic, universally acclaimed television series in their correct release order.";
    case "history":
    case "world history":
    case "historic events":
    case "historical events":
      return "Place major historical events in their correct chronological order.";
    case "sports":
    case "sports history":
    case "sports events":
    case "historic moments":
    case "sports achievements":
      return "Place legendary sports moments and achievements in chronological order.";
    default:
      return "";
  }
}

type Props = {
  games: PublicGameSummary[];
};

export default function HomePageClient({ games }: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  const [randomGames, setRandomGames] = useState(games.slice(0, 10));
  const [todayScores, setTodayScores] = useState<Record<string, { score: number; username: string }>>({});

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

    const shuffled = [...games].sort(() => Math.random() - 0.5);
    setRandomGames(shuffled.slice(0, 10));

    const today = new Date().toLocaleDateString("en-CA");
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

      {Object.entries(
        games.reduce((acc, game) => {
          const cat = game.category || "Other";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(game);
          return acc;
        }, {} as Record<string, typeof games>)
      ).map(([categoryName, categoryGames]) => {
        const gamesBySubcategory = categoryGames.reduce((acc, game) => {
          const sub = game.subcategory || "Other";
          if (!acc[sub]) acc[sub] = [];
          acc[sub].push(game);
          return acc;
        }, {} as Record<string, typeof games>);

        return (
          <section key={categoryName} className="game-list-section" style={{ gap: "16px", marginBottom: "48px" }}>
            <div className="game-list-header">
              <h2 className="game-list-title">{categoryName}</h2>
            </div>

            <div className="game-subcategories-container" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {Object.entries(gamesBySubcategory).map(([subName, subGames]) => {
                const subDesc = getSubcategoryDescription(subName);
                return (
                  <div key={subName} className="game-subcategory-group">
                    {subName !== "Other" && (
                      <div style={{ marginBottom: "12px" }}>
                        <p className="game-subcategory-title" style={{
                          fontSize: "0.9rem",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "var(--muted)",
                          marginTop: "0",
                          marginBottom: "6px",
                          fontFamily: "var(--font-mono)",
                          borderBottom: "1px dashed var(--line)",
                          paddingBottom: "8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}>
                          <span>↳</span> {subName}
                        </p>
                        {subDesc && (
                          <p style={{
                            fontSize: "0.76rem",
                            color: "var(--muted)",
                            fontFamily: "var(--font-mono)",
                            margin: "0 0 12px 18px",
                            lineHeight: "1.4"
                          }}>
                            {subDesc}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="game-list" aria-label={`${categoryName} - ${subName} games`}>
                      {subGames.map((game) => (
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
                          </div>
                          <div className="game-card-content">
                            <h3>{game.shortTitle ?? game.title}</h3>
                            {!subDesc && game.description && (
                              <p className="game-card-description">{game.description}</p>
                            )}
                          </div>
                          {mounted && (
                            <div className="game-card-highscore">
                              <span className="game-card-highscore-label">
                                Today&apos;s best
                              </span>
                              {todayScores[game.id] && todayScores[game.id].score > 0 ? (
                                <span className="game-card-highscore-value">
                                  <strong className="score-badge">{todayScores[game.id].score}</strong>
                                  <span className="by-label">by</span>
                                  <span className="username-badge">{todayScores[game.id].username}</span>
                                </span>
                              ) : (
                                <span className="game-card-highscore-none">No scores yet</span>
                              )}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

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
