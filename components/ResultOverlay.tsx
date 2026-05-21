"use client";

import { useEffect, useMemo, useState } from "react";
import type { TimelineGameData, TimelineItem } from "@/lib/timeline-types";

type Rank = {
  min: number;
  title: string;
};

const ranks: Rank[] = [
  { min: 25, title: "Timeline Royalty" },
  { min: 18, title: "Club Historian" },
  { min: 12, title: "Memory Merchant" },
  { min: 7, title: "Sharp Fan" },
  { min: 3, title: "Warm Starter" },
  { min: 0, title: "Fresh Boots" }
];

function getRank(score: number): Rank {
  return ranks.find((rank) => score >= rank.min) || ranks[ranks.length - 1];
}

function makeShareGrid(score: number): string {
  const marks = Array.from({ length: score }, () => "🟩").concat("❌");
  const rows = [];

  for (let index = 0; index < marks.length; index += 10) {
    rows.push(marks.slice(index, index + 10).join(""));
  }

  return rows.join("\n");
}

type ResultOverlayProps = {
  game: TimelineGameData;
  score: number;
  best: number;
  timeline: TimelineItem[];
  candidate: TimelineItem | null;
  failedPivotCard: TimelineItem | null;
  failedDirection: "before" | "after" | null;
  dailyNumber: number;
  isDailyCompleted: boolean;
  timeUntilMidnight: string;
  onClose: () => void;
  onPlayAgain: () => void;
  formatPlayerLabel: (label: string) => string;
};

export function ResultOverlay({
  game,
  score,
  best,
  timeline,
  candidate,
  failedPivotCard,
  failedDirection,
  dailyNumber,
  isDailyCompleted,
  timeUntilMidnight,
  onClose,
  onPlayAgain,
  formatPlayerLabel
}: ResultOverlayProps) {
  const rank = getRank(score);
  const [username, setUsername] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<"daily" | "allTime">("daily");
  const [leaderboardDate, setLeaderboardDate] = useState("");
  const [leaderboardScores, setLeaderboardScores] = useState<any[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<"stats" | "leaderboard">("stats");
  const [todayDailyScores, setTodayDailyScores] = useState<any[]>([]);
  const [shareCopied, setShareCopied] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");

  const fetchLeaderboard = async (dateStr: string, showAllTime: boolean) => {
    setIsLeaderboardLoading(true);
    try {
      const url = `/api/leaderboard?gameId=${game.id}${showAllTime ? "&allTime=true" : `&date=${dateStr}`}`;
      const res = await fetch(url);
      const data = await res.json();
      const fetchedScores = data.scores || [];
      setLeaderboardScores(fetchedScores);

      const todayDateStr = new Date().toLocaleDateString("en-CA");
      if (!showAllTime && dateStr === todayDateStr) {
        setTodayDailyScores(fetchedScores);
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    // Restore username and load initial scores
    const savedUsername = localStorage.getItem("eras:username");
    if (savedUsername) {
      setUsername(savedUsername);
    }

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
    setFormattedDate(today.toLocaleDateString("en-US", options));

    const dateStr = today.toLocaleDateString("en-CA");
    setLeaderboardDate(dateStr);

    const savedDaily = localStorage.getItem(`eras:${game.id}:daily:${dateStr}`);
    if (savedDaily) {
      try {
        const parsed = JSON.parse(savedDaily);
        if (parsed && parsed.isCompleted) {
          setHasSubmitted(parsed.hasSubmitted || false);
        }
      } catch (e) {
        console.error("Failed to parse saved daily challenge", e);
      }
    }

    fetchLeaderboard(dateStr, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.id]);

  // Load leaderboard when toggled or date shifts
  useEffect(() => {
    if (activeResultTab === "leaderboard") {
      const showAllTime = leaderboardTab === "allTime";
      const dateStr = leaderboardDate || new Date().toLocaleDateString("en-CA");
      fetchLeaderboard(dateStr, showAllTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeResultTab, leaderboardTab, leaderboardDate]);

  async function submitScore(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || hasSubmitted) return;

    localStorage.setItem("eras:username", username.trim());
    try {
      const dateStr = new Date().toLocaleDateString("en-CA");
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: game.id,
          username: username.trim(),
          score,
          date: dateStr
        })
      });
      if (res.ok) {
        setHasSubmitted(true);
        // Save to today's local challenge storage that we submitted
        const saved = localStorage.getItem(`eras:${game.id}:daily:${dateStr}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.hasSubmitted = true;
          localStorage.setItem(`eras:${game.id}:daily:${dateStr}`, JSON.stringify(parsed));
        }

        // Instantly toggle to leaderboard view and load scores
        setActiveResultTab("leaderboard");
        setLeaderboardTab("daily");
        setLeaderboardDate(dateStr);
        fetchLeaderboard(dateStr, false);
      }
    } catch (e) {
      console.error("Failed to submit score", e);
    }
  }

  const shiftLeaderboardDate = (days: number) => {
    if (!leaderboardDate) return;
    try {
      const parts = leaderboardDate.split("-");
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + days);
      setLeaderboardDate(d.toLocaleDateString("en-CA"));
    } catch (e) {
      console.error("Failed to parse date", e);
    }
  };

  const getCalculatedDailyNumber = (dateStr: string): number => {
    try {
      const parts = dateStr.split("-");
      const today = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const d1 = new Date(2026, 4, 21); // May 21st, 2026
      const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const diffMs = d2.getTime() - d1.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(1, diffDays + 1);
    } catch (e) {
      return 1;
    }
  };

  async function shareResult() {
    let rankingText = "";
    if (todayDailyScores.length > 0) {
      let rankNum = -1;
      const searchName = username.trim().toLowerCase();
      if (searchName) {
        const myIndex = todayDailyScores.findIndex(
          (entry) => entry.username.toLowerCase() === searchName
        );
        if (myIndex >= 0) {
          rankNum = myIndex + 1;
        }
      }

      if (rankNum === -1) {
        const hypotheticalIndex = todayDailyScores.findIndex(
          (entry) => score >= entry.score
        );
        rankNum = hypotheticalIndex >= 0 ? hypotheticalIndex + 1 : todayDailyScores.length + 1;
      }

      if (rankNum >= 1 && rankNum <= 10) {
        const medals = ["🥇", "🥈", "🥉"];
        const medal = rankNum <= 3 ? medals[rankNum - 1] : "⭐";
        rankingText = `Rank: ${medal} #${rankNum} on Leaderboard today!\n`;
      }
    }

    const text = `${game.share.title} #${dailyNumber}\nStreak: ${score} - ${rank.title}\n${rankingText}${makeShareGrid(score)}\n\n${game.share.description}\nhttps://erasgames.com${game.sitePath}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${game.share.title} #${dailyNumber}`,
          text,
          url: `https://erasgames.com${game.sitePath}`
        });
        return;
      } catch {
        // Fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1800);
  }

  const cleanTitle = useMemo(() => game.title.replace(/\s*Timeline\s*/gi, "").trim(), [game.title]);

  return (
    <div className="result-overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="result-panel">
        <header className="result-header">
          {formattedDate && <span className="result-date">{formattedDate}</span>}
          <h2 id="result-title">Your {cleanTitle} Timeline #{dailyNumber}</h2>
          <button type="button" className="result-close" aria-label="Close results" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modal-tabs">
          <button
            type="button"
            className={activeResultTab === "stats" ? "active" : ""}
            onClick={() => setActiveResultTab("stats")}
          >
            My Stats
          </button>
          <button
            type="button"
            className={activeResultTab === "leaderboard" ? "active" : ""}
            onClick={() => setActiveResultTab("leaderboard")}
          >
            Leaderboard
          </button>
        </div>

        {activeResultTab === "stats" ? (
          <div className="result-content">
            <div className="result-rank">{rank.title}</div>
            <div className="result-score" aria-label={`${score} correct answers`}>
              <span>Final streak</span>
              <strong>{score}</strong>
              <small>{score === 1 ? "correct player" : "correct players"}</small>
            </div>
            <div className="result-grid-visual" aria-label="Result grid">
              {Array.from({ length: score }).map((_, i) => (
                <span key={i} className="grid-tile correct" aria-hidden="true">✓</span>
              ))}
              <span className="grid-tile incorrect" aria-hidden="true">×</span>
            </div>
            <div className="result-stats">
              <span>
                <strong>{best}</strong>
                Personal best
              </span>
              <span>
                <strong>{timeline.length}</strong>
                Timeline cards
              </span>
            </div>

            {!hasSubmitted && isDailyCompleted && (
              <form onSubmit={submitScore} className="leaderboard-submit-form">
                <h3>Submit to Leaderboard</h3>
                <div className="form-input-group">
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={24}
                    required
                  />
                  <button type="submit">Submit</button>
                </div>
              </form>
            )}

            <div className="result-actions">
              {isDailyCompleted ? (
                <div className="result-next-countdown" title="Next daily challenge unlocked at midnight">
                  <span>Next game in</span>
                  <strong>{timeUntilMidnight || "--h --m --s"}</strong>
                </div>
              ) : (
                <button type="button" onClick={onPlayAgain}>
                  Play again
                </button>
              )}
              <button type="button" onClick={shareResult}>
                {shareCopied ? "Copied" : "Share result"}
              </button>
            </div>
          </div>
        ) : (
          <div className="result-content leaderboard-view">
            <div className="leaderboard-subtabs">
              <button
                type="button"
                className={leaderboardTab === "daily" ? "active" : ""}
                onClick={() => setLeaderboardTab("daily")}
              >
                Daily
              </button>
              <button
                type="button"
                className={leaderboardTab === "allTime" ? "active" : ""}
                onClick={() => setLeaderboardTab("allTime")}
              >
                All-Time
              </button>
            </div>

            {leaderboardTab === "daily" && leaderboardDate && (
              <div className="date-navigator">
                <button
                  type="button"
                  disabled={getCalculatedDailyNumber(leaderboardDate) <= 1}
                  onClick={() => shiftLeaderboardDate(-1)}
                >
                  ←
                </button>
                <span className="date-display">
                  Day #{getCalculatedDailyNumber(leaderboardDate)} ({leaderboardDate})
                </span>
                <button
                  type="button"
                  disabled={leaderboardDate === new Date().toLocaleDateString("en-CA")}
                  onClick={() => shiftLeaderboardDate(1)}
                >
                  →
                </button>
              </div>
            )}

            {isLeaderboardLoading ? (
              <div className="leaderboard-loading">Loading scores...</div>
            ) : leaderboardScores.length === 0 ? (
              <div className="leaderboard-empty">
                No scores submitted yet. Be the first!
              </div>
            ) : (
              <div className="leaderboard-table-wrapper">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                      {leaderboardTab === "allTime" && <th>Date</th>}
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardScores.map((entry, i) => {
                      const isMe = entry.username.toLowerCase() === username.toLowerCase();
                      let rankDisplay: React.ReactNode = i + 1;
                      if (i === 0) rankDisplay = "🥇";
                      else if (i === 1) rankDisplay = "🥈";
                      else if (i === 2) rankDisplay = "🥉";

                      return (
                        <tr key={i} className={isMe ? "row-highlight" : ""}>
                          <td className="col-rank">{rankDisplay}</td>
                          <td className="col-player">{formatPlayerLabel(entry.username)}</td>
                          {leaderboardTab === "allTime" && (
                            <td className="col-date">
                              {entry.date ? `Day #${getCalculatedDailyNumber(entry.date)}` : ""}
                            </td>
                          )}
                          <td className="col-score">{entry.score}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
