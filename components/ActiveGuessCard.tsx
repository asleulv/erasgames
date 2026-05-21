"use client";

import type { TimelineItem } from "@/lib/timeline-types";

type ActiveGuessCardProps = {
  candidate: TimelineItem;
  pivot: TimelineItem;
  isResolving: boolean;
  onAnswer: (direction: "before" | "after") => void;
  formatPlayerLabel: (label: string) => string;
};

export function ActiveGuessCard({
  candidate,
  pivot,
  isResolving,
  onAnswer,
  formatPlayerLabel
}: ActiveGuessCardProps) {
  return (
    <article className="timeline-card active-card" data-active-card="1">
      <div
        key={candidate.id}
        className="timer-bar"
        style={isResolving ? { animationPlayState: "paused" } : undefined}
      />
      <h3>{formatPlayerLabel(candidate.label)}</h3>
      <div className="question-line">
        <span>Before or after</span>
        <strong>{pivot.year}</strong>
      </div>
      <div className="answer-grid">
        <button type="button" disabled={isResolving} onClick={() => onAnswer("before")}>
          Before
        </button>
        <button type="button" disabled={isResolving} onClick={() => onAnswer("after")}>
          After
        </button>
      </div>
    </article>
  );
}
