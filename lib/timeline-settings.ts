export type TimelineDifficultyStep = {
  score: number;
  minGap: number;
  maxGap: number;
};

export type TimelineGameSettings = {
  difficulty: {
    yearGapSteps: TimelineDifficultyStep[];
    maxCandidatePool: number;
    minCandidatePool: number;
  };
  timing: {
    correctRevealMs: number;
    scrollAfterCorrectMs: number;
  };
};

export type TimelineGameSettingsOverride = {
  difficulty?: Partial<TimelineGameSettings["difficulty"]>;
  timing?: Partial<TimelineGameSettings["timing"]>;
};

export const defaultTimelineSettings: TimelineGameSettings = {
  difficulty: {
    yearGapSteps: [
      { score: 0, minGap: 10, maxGap: 40 },
      { score: 1, minGap: 6, maxGap: 18 },
      { score: 3, minGap: 3, maxGap: 10 },
      { score: 6, minGap: 2, maxGap: 7 },
      { score: 10, minGap: 1, maxGap: 4 },
      { score: 15, minGap: 1, maxGap: 2 }
    ],
    maxCandidatePool: 36,
    minCandidatePool: 14
  },
  timing: {
    correctRevealMs: 520,
    scrollAfterCorrectMs: 760
  }
};

export function resolveTimelineSettings(overrides?: TimelineGameSettingsOverride): TimelineGameSettings {
  return {
    difficulty: {
      ...defaultTimelineSettings.difficulty,
      ...overrides?.difficulty,
      yearGapSteps: overrides?.difficulty?.yearGapSteps || defaultTimelineSettings.difficulty.yearGapSteps
    },
    timing: {
      ...defaultTimelineSettings.timing,
      ...overrides?.timing
    }
  };
}

export function yearGapForScore(settings: TimelineGameSettings, score: number): TimelineDifficultyStep {
  const steps = settings.difficulty.yearGapSteps;

  return steps.reduce((gap, step) => {
    return score >= step.score ? step : gap;
  }, steps[0] || { score: 0, minGap: 0, maxGap: Number.MAX_SAFE_INTEGER });
}
