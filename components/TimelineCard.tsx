"use client";

import type { TimelineItem } from "@/lib/timeline-types";

type TimelineCardProps = {
  item: TimelineItem;
  index: number;
  isReference: boolean;
  isFailed: boolean;
  shouldDim: boolean;
  isJustCorrect: boolean;
  failedDirection: "before" | "after" | null;
  formatPlayerLabel: (label: string) => string;
};

export function TimelineCard({
  item,
  index,
  isReference,
  isFailed,
  shouldDim,
  isJustCorrect,
  failedDirection,
  formatPlayerLabel
}: TimelineCardProps) {
  return (
    <article
      className={`timeline-card ${shouldDim && !isReference && !isFailed ? "is-dimmed" : ""} ${
        isJustCorrect ? "just-correct" : ""
      } ${isReference ? "reference-card" : ""} ${isFailed ? "failed-card" : ""}`}
      data-timeline-item={item.id}
      data-current-reference={isReference ? "1" : undefined}
    >
      <span className="card-index">#{index + 1}</span>
      <div className="mini-card-main">
        <div>
          <h3>{formatPlayerLabel(item.label)}</h3>
          {item.subtitle && <p className="mini-card-subtitle">{item.subtitle}</p>}
          {isFailed && (
            <span className="failed-badge">
              {failedDirection === null ? "❌ Time's Up" : "❌ Incorrect placement"}
            </span>
          )}
        </div>
        <strong className="year-pill">{item.year}</strong>
      </div>
    </article>
  );
}
