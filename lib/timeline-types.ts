import type { TimelineGameSettingsOverride } from "./timeline-settings";

export type TimelineItem = {
  id: string;
  label: string;
  year: number;
  subtitle?: string;
  description?: string;
  popularity?: number;
  tags?: string[];
  source?: string | null;
};

export type TimelineTheme = {
  primary: string;
  secondary: string;
  background: string;
  text: string;
};

export type TimelineGameData = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  sitePath: string;
  theme: TimelineTheme;
  settings?: TimelineGameSettingsOverride;
  share: {
    title: string;
    description: string;
    hashtags: string[];
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  items: TimelineItem[];
};

export type PublicGameSummary = Pick<
  TimelineGameData,
  "id" | "slug" | "title" | "shortTitle" | "description" | "category" | "sitePath" | "theme"
> & {
  itemCount: number;
};
