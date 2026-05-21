"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { resolveTimelineSettings, yearGapForScore } from "@/lib/timeline-settings";
import { createRng, getPlayableItems, makeSeed, pickWeighted } from "@/lib/timeline-engine";
import type { TimelineGameData, TimelineItem } from "@/lib/timeline-types";
import type { TimelineGameSettings } from "@/lib/timeline-settings";
import { ResultOverlay } from "./ResultOverlay";
import { TimelineCard } from "./TimelineCard";
import { ActiveGuessCard } from "./ActiveGuessCard";

type TimelineGameProps = {
  game: TimelineGameData;
};

type FlipSnapshot = {
  activeRect: DOMRect | null;
  answeredId: string;
  itemRects: Map<string, DOMRect>;
};

function chooseCandidate(
  deck: TimelineItem[],
  timeline: TimelineItem[],
  reference: TimelineItem,
  random: () => number,
  score: number,
  settings: TimelineGameSettings
): TimelineItem | null {
  const used = new Set(timeline.map((item) => item.id));
  const available = deck.filter((item) => !used.has(item.id) && item.year !== reference.year);
  const targetGap = yearGapForScore(settings, score);
  const poolSize = Math.max(settings.difficulty.minCandidatePool, settings.difficulty.maxCandidatePool - score);

  for (let maxGap = targetGap.maxGap; maxGap <= 80; maxGap += 4) {
    const pool = available.filter((item) => {
      const distance = Math.abs(item.year - reference.year);
      return distance >= targetGap.minGap && distance <= maxGap;
    });
    if (pool.length) {
      return pickWeighted(pool.slice(0, poolSize), random);
    }
  }

  for (let minGap = targetGap.minGap - 1; minGap >= 0; minGap -= 1) {
    const pool = available.filter((item) => {
      const distance = Math.abs(item.year - reference.year);
      return distance >= minGap && distance <= targetGap.maxGap;
    });
    if (pool.length) {
      return pickWeighted(pool.slice(0, poolSize), random);
    }
  }

  return available.length ? pickWeighted(available, random) : null;
}

function getLum(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function formatPlayerLabel(label: string): string {
  if (label && label.trim().toLowerCase() === "diogo jota") {
    return "Diogo Jota 🖤";
  }
  return label;
}

export function TimelineGame({ game }: TimelineGameProps) {
  const cleanTitle = useMemo(() => game.title.replace(/\s*Timeline\s*/gi, "").trim(), [game.title]);
  
  const brandAccent = useMemo(() => {
    if (getLum(game.theme.primary) < 0.35) return game.theme.primary;
    if (getLum(game.theme.secondary) < 0.35) return game.theme.secondary;
    return game.theme.text; // always dark
  }, [game.theme.primary, game.theme.secondary, game.theme.text]);

  const activeCardAccent = useMemo(() => {
    if (getLum(game.theme.primary) > 0.40) return game.theme.primary;
    if (getLum(game.theme.secondary) > 0.40) return game.theme.secondary;
    return "#ffffff";
  }, [game.theme.primary, game.theme.secondary]);

  const primaryText = useMemo(() => {
    return getLum(game.theme.primary) > 0.40 ? game.theme.text : "#ffffff";
  }, [game.theme.primary, game.theme.text]);

  const randomRef = useRef<() => number>(() => Math.random());
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [candidate, setCandidate] = useState<TimelineItem | null>(null);
  const [pivot, setPivot] = useState<TimelineItem | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [lastCorrectId, setLastCorrectId] = useState<string | null>(null);
  const [message, setMessage] = useState("New run. Build the timeline as far as you can.");
  const [showResult, setShowResult] = useState(false);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const pendingFlipRef = useRef<FlipSnapshot | null>(null);
  const settings = useMemo(() => resolveTimelineSettings(game.settings), [game.settings]);

  const [isDailyCompleted, setIsDailyCompleted] = useState(false);
  const [timeUntilMidnight, setTimeUntilMidnight] = useState("");
  const [failedDirection, setFailedDirection] = useState<"before" | "after" | null>(null);
  const [failedPivotCard, setFailedPivotCard] = useState<TimelineItem | null>(null);
  const [formattedDate, setFormattedDate] = useState("");
  const [isGameStarted, setIsGameStarted] = useState(false);

  const deck = useMemo(
    () =>
      getPlayableItems(game.items)
        .filter((item) => (item.popularity || 0) >= 35)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0)),
    [game.items]
  );

  function startGame() {
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-CA");
    const seed = makeSeed(`${game.id}-${dateStr}`);
    randomRef.current = createRng(seed);
    const starterPool = deck.filter((item) => (item.popularity || 0) >= 70);
    const first = pickWeighted(starterPool.length ? starterPool : deck, randomRef.current);
    const initialTimeline = [first];
    const next = chooseCandidate(deck, initialTimeline, first, randomRef.current, 0, settings);
    setTimeline(initialTimeline);
    setCandidate(next);
    setPivot(next ? first : null);
    setScore(0);
    setIsOver(false);
    setIsResolving(false);
    setLastCorrectId(null);
    setShowResult(false);
    setFailedDirection(null);
    setFailedPivotCard(null);
    setIsGameStarted(false);
    setMessage("New run. Build the timeline as far as you can.");
  }

  function advance(nextTimeline: TimelineItem[], nextScore: number, reference: TimelineItem) {
    const next = chooseCandidate(deck, nextTimeline, reference, randomRef.current, nextScore, settings);
    setCandidate(next);
    setPivot(next ? reference : null);
    setIsResolving(false);
    if (!next) {
      saveDailyRun(nextScore, nextTimeline);
      setIsOver(true);
      window.setTimeout(() => setShowResult(true), 700);
      setMessage("You cleared the playable deck.");
    }
  }

  function captureFlipSnapshot(answeredId: string): FlipSnapshot {
    const itemRects = new Map<string, DOMRect>();
    document.querySelectorAll<HTMLElement>("[data-timeline-item]").forEach((element) => {
      const id = element.dataset.timelineItem;
      if (id) itemRects.set(id, element.getBoundingClientRect());
    });

    return {
      activeRect: document.querySelector<HTMLElement>("[data-active-card='1']")?.getBoundingClientRect() || null,
      answeredId,
      itemRects
    };
  }

  function answer(direction: "before" | "after") {
    if (!candidate || !pivot || isOver || isResolving) return;
    setIsResolving(true);
    const cameBefore = candidate.year < pivot.year;
    const correct = direction === "before" ? cameBefore : !cameBefore;

    if (!correct) {
      const finalBest = Math.max(best, score);
      setBest(finalBest);
      localStorage.setItem(`eras:${game.id}:best`, String(finalBest));
      setFailedDirection(direction);
      setFailedPivotCard(pivot);
      saveDailyRun(score, timeline, candidate, direction, pivot);
      setIsOver(true);
      setIsResolving(false);
      window.setTimeout(() => setShowResult(true), 700);
      setMessage(
        `${formatPlayerLabel(candidate.label)} joined ${cameBefore ? "before" : "after"} ${formatPlayerLabel(pivot.label)}. ${candidate.year} versus ${pivot.year}.`
      );
      return;
    }

    const nextScore = score + 1;
    const answered = candidate;
    const nextTimeline = [...timeline, candidate].sort((a, b) => a.year - b.year || a.label.localeCompare(b.label));
    setScore(nextScore);
    setBest((current) => {
      const nextBest = Math.max(current, nextScore);
      localStorage.setItem(`eras:${game.id}:best`, String(nextBest));
      return nextBest;
    });
    setMessage(`Correct. ${formatPlayerLabel(answered.label)} joined in ${answered.year}.`);
    window.setTimeout(() => {
      pendingFlipRef.current = captureFlipSnapshot(answered.id);
      setTimeline(nextTimeline);
      setLastCorrectId(answered.id);
      advance(nextTimeline, nextScore, answered);
    }, settings.timing.correctRevealMs);
  }

  const dailyNumber = useMemo(() => {
    const today = new Date();
    const d1 = new Date(2026, 4, 21); // May 21st, 2026
    const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffMs = d2.getTime() - d1.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
  }, []);

  function saveDailyRun(
    finalScore: number,
    finalTimeline: TimelineItem[],
    failedCard?: TimelineItem | null,
    failedDirection?: "before" | "after" | null,
    failedPivotCard?: TimelineItem | null
  ) {
    const dateStr = new Date().toLocaleDateString("en-CA");
    const data = {
      score: finalScore,
      timeline: finalTimeline,
      isCompleted: true,
      failedCard: failedCard || null,
      failedDirection: failedDirection || null,
      failedPivotCard: failedPivotCard || null
    };
    localStorage.setItem(`eras:${game.id}:daily:${dateStr}`, JSON.stringify(data));
    setIsDailyCompleted(true);
  }

  useEffect(() => {
    setBest(Number(localStorage.getItem(`eras:${game.id}:best`) || 0));

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
    setFormattedDate(today.toLocaleDateString("en-US", options));

    const dateStr = today.toLocaleDateString("en-CA");
    const savedDaily = localStorage.getItem(`eras:${game.id}:daily:${dateStr}`);
    if (savedDaily) {
      try {
        const parsed = JSON.parse(savedDaily);
        if (parsed && parsed.isCompleted) {
          setTimeline(parsed.timeline || []);
          setScore(parsed.score || 0);
          setIsOver(true);
          setCandidate(parsed.failedCard || null);
          setFailedDirection(parsed.failedDirection || null);
          setFailedPivotCard(parsed.failedPivotCard || null);
          setPivot(null);
          setIsDailyCompleted(true);
          setShowResult(true);
          setIsGameStarted(true);
          setMessage("Daily challenge completed! Return tomorrow for the next challenge.");
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved daily challenge", e);
      }
    }

    setIsDailyCompleted(false);
    startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.id]);

  // Ticking midnight countdown timer
  useEffect(() => {
    if (!isDailyCompleted) return;

    function updateCountdown() {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffMs = midnight.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeUntilMidnight("00h 00m 00s");
        return;
      }
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const hStr = String(hours).padStart(2, "0");
      const mStr = String(minutes).padStart(2, "0");
      const sStr = String(seconds).padStart(2, "0");
      setTimeUntilMidnight(`${hStr}h ${mStr}m ${sStr}s`);
    }

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [isDailyCompleted]);

  useLayoutEffect(() => {
    const snapshot = pendingFlipRef.current;
    if (!snapshot) return;
    pendingFlipRef.current = null;

    const answeredElement = document.querySelector<HTMLElement>(`[data-timeline-item="${snapshot.answeredId}"]`);
    if (snapshot.activeRect && answeredElement) {
      answeredElement.animate(
        [
          {
            opacity: 0,
            transform: "translateY(18px) scale(0.98)",
            filter: "blur(4px)"
          },
          {
            opacity: 1,
            transform: "translateY(0) scale(1)",
            filter: "blur(0)"
          }
        ],
        {
          duration: 520,
          delay: 120,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both"
        }
      );
    }

    document.querySelectorAll<HTMLElement>("[data-timeline-item]").forEach((element) => {
      const id = element.dataset.timelineItem;
      if (!id) return;
      if (id === snapshot.answeredId) return;

      const after = element.getBoundingClientRect();
      const before = snapshot.itemRects.get(id);
      const source = before;
      if (!source) return;

      const dx = source.left - after.left;
      const dy = source.top - after.top;
      const scaleX = 1;
      const scaleY = 1;

      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(scaleX - 1) < 0.01 && Math.abs(scaleY - 1) < 0.01) {
        return;
      }

      element.style.transformOrigin = "top left";
      element.style.zIndex = "2";
      element.animate(
        [
          {
            transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
            opacity: 1
          },
          {
            transform: "translate(0, 0) scale(1, 1)",
            opacity: 1
          }
        ],
        {
          duration: 700,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both"
        }
      ).finished
        .catch(() => undefined)
        .finally(() => {
        element.style.transformOrigin = "";
        element.style.zIndex = "";
      });
    });
  }, [timeline, candidate?.id]);

  useEffect(() => {
    if (isResolving) return;
    const active = activeRef.current;
    if (!active) return;

    const timeout = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        const rect = active.getBoundingClientRect();
        const targetTop = window.innerHeight * 0.42;
        const delta = rect.top - targetTop;
        if (Math.abs(delta) > 14) {
          window.scrollTo({ top: window.scrollY + delta, behavior: "smooth" });
        }
      });
    }, lastCorrectId ? settings.timing.scrollAfterCorrectMs : 0);

    return () => window.clearTimeout(timeout);
  }, [candidate?.id, pivot?.id, timeline.length, isResolving, lastCorrectId, settings.timing.scrollAfterCorrectMs]);

  // Countdown timer for active candidate card (10 seconds)
  useEffect(() => {
    if (isOver || isResolving || !candidate || !pivot || !isGameStarted) return;

    const timerId = window.setTimeout(() => {
      const finalBest = Math.max(best, score);
      setBest(finalBest);
      localStorage.setItem(`eras:${game.id}:best`, String(finalBest));
      setIsOver(true);
      setFailedDirection(null);
      setFailedPivotCard(pivot);
      saveDailyRun(score, timeline, candidate, null, pivot);
      window.setTimeout(() => setShowResult(true), 700);
      setMessage(`Time's up! You took too long to decide if ${formatPlayerLabel(candidate.label)} joined before or after ${formatPlayerLabel(pivot.label)}'s year.`);
    }, 10000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [candidate?.id, isOver, isResolving, pivot?.id, score, best, game.id, pivot?.label, isGameStarted]);

  const shouldDimInactiveCards = Boolean(candidate && !isOver && timeline.length > 1);

  const endOfGameTimeline = useMemo(() => {
    const mapped = timeline.map(item => ({ ...item, isFailedCard: false }));
    if (!isOver || !candidate) return mapped;

    let insertIndex = -1;
    if (failedPivotCard) {
      const pivotIndex = mapped.findIndex(item => item.id === failedPivotCard.id);
      if (pivotIndex > -1) {
        if (failedDirection === "before") {
          insertIndex = pivotIndex;
        } else if (failedDirection === "after") {
          insertIndex = pivotIndex + 1;
        }
      }
    }

    if (insertIndex === -1) {
      // Fallback to chronological sorted position
      insertIndex = mapped.findIndex(item => item.year > candidate.year || (item.year === candidate.year && item.label.localeCompare(candidate.label) > 0));
      if (insertIndex === -1) {
        insertIndex = mapped.length;
      }
    }
    
    const combined = [...mapped];
    combined.splice(insertIndex, 0, { ...candidate, isFailedCard: true });
    return combined;
  }, [isOver, candidate, timeline, failedPivotCard, failedDirection]);

  return (
    <section
      className="timeline-game"
      style={
        {
          "--game-primary": game.theme.primary,
          "--game-secondary": game.theme.secondary,
          "--game-bg": game.theme.background,
          "--game-text": game.theme.text,
          "--game-brand-accent": brandAccent,
          "--game-active-accent": activeCardAccent,
          "--game-primary-text": primaryText
        } as React.CSSProperties
      }
    >
      <header className="game-header">
        <div>
          <p className="eyebrow">Eras Games</p>
          <h1>{game.title}</h1>
        </div>
        <div className="score-grid">
          <span>
            Streak <strong>{score}</strong>
          </span>
          <span>
            Best <strong>{best}</strong>
          </span>
          <span>
            Line <strong>{timeline.length}</strong>
          </span>
        </div>
      </header>

      <div className="game-copy">
        {formattedDate && <span className="game-date">{formattedDate}</span>}
        <h2>The {cleanTitle} Timeline #{dailyNumber}</h2>
        <p>
          Did each player join {cleanTitle} <strong>before</strong> or <strong>after</strong> the active card's year? One mistake ends your streak!
        </p>
      </div>

      <div className={`timeline-feed ${shouldDimInactiveCards ? "has-focus" : ""}`}>
        {endOfGameTimeline.map((item, index) => {
          const isReference = candidate && pivot?.id === item.id && !isOver;
          const isFailed = (item as any).isFailedCard;

          return (
            <div className="timeline-node" key={item.id}>
              {index > 0 && <div className="timeline-stem" />}
              <TimelineCard
                item={item}
                index={index}
                isReference={isReference || false}
                isFailed={isFailed}
                shouldDim={shouldDimInactiveCards && !isReference && !isFailed}
                isJustCorrect={lastCorrectId === item.id}
                failedDirection={failedDirection}
                formatPlayerLabel={formatPlayerLabel}
              />

              {isReference && (
                <div className="timeline-node active-node" ref={activeRef}>
                  <div className="timeline-stem" />
                  {isGameStarted ? (
                    <ActiveGuessCard
                      candidate={candidate}
                      pivot={pivot}
                      isResolving={isResolving}
                      onAnswer={answer}
                      formatPlayerLabel={formatPlayerLabel}
                    />
                  ) : (
                    <article className="timeline-card start-card">
                      <h3>Ready to Play?</h3>
                      <p>
                        Test your memory by placing each player on the timeline. One mistake ends your streak, and a 10-second timer runs for each card!
                      </p>
                      <button type="button" className="btn-start-game" onClick={() => setIsGameStarted(true)}>
                        Start Game
                      </button>
                    </article>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isOver && !showResult && (
        <button type="button" className="result-reopen" onClick={() => setShowResult(true)}>
          Results
        </button>
      )}

      {showResult && (
        <ResultOverlay
          game={game}
          score={score}
          best={best}
          timeline={timeline}
          candidate={candidate}
          failedPivotCard={failedPivotCard}
          failedDirection={failedDirection}
          dailyNumber={dailyNumber}
          isDailyCompleted={isDailyCompleted}
          timeUntilMidnight={timeUntilMidnight}
          onClose={() => setShowResult(false)}
          onPlayAgain={startGame}
          formatPlayerLabel={formatPlayerLabel}
        />
      )}
    </section>
  );
}
