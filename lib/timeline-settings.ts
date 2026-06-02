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

export type TimelineSettingsProfile = "default" | "media";

const defaultTimelineSettings: TimelineGameSettings = {
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

const mediaTimelineSettings: TimelineGameSettings = {
  ...defaultTimelineSettings,
  difficulty: {
    yearGapSteps: [
      { score: 0, minGap: 35, maxGap: 85 },
      { score: 1, minGap: 25, maxGap: 65 },
      { score: 3, minGap: 16, maxGap: 45 },
      { score: 6, minGap: 8, maxGap: 25 },
      { score: 10, minGap: 4, maxGap: 14 },
      { score: 15, minGap: 1, maxGap: 8 }
    ],
    maxCandidatePool: 28,
    minCandidatePool: 10
  }
};

const timelineSettingsProfiles: Record<TimelineSettingsProfile, TimelineGameSettings> = {
  default: defaultTimelineSettings,
  media: mediaTimelineSettings
};

const MEDIA_PROFILE_START_DATE = "2026-06-02";

export function getTimelineSettingsProfile(
  category: string,
  subcategory?: string,
  dateStr = new Date().toLocaleDateString("en-CA")
): TimelineSettingsProfile {
  if (dateStr < MEDIA_PROFILE_START_DATE) return "default";

  if (category === "Movies & TV" || category === "Movies" || subcategory === "Movies" || subcategory === "TV Shows") {
    return "media";
  }

  return "default";
}

export function resolveTimelineSettings(
  profile: TimelineSettingsProfile = "default",
  overrides?: TimelineGameSettingsOverride
): TimelineGameSettings {
  const base = timelineSettingsProfiles[profile] || timelineSettingsProfiles.default;

  return {
    difficulty: {
      ...base.difficulty,
      ...overrides?.difficulty,
      yearGapSteps: overrides?.difficulty?.yearGapSteps || base.difficulty.yearGapSteps
    },
    timing: {
      ...base.timing,
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
