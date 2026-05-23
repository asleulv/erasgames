import type { PublicGameSummary, TimelineGameData } from "@/lib/timeline-types";

// Dynamically import all JSON datasets from the data/games directory automatically
const context = (require as any).context("@/data/games", false, /\.json$/);
const games = context.keys().map((key: string) => {
  const fileData = context(key);
  // Support both ESModules and standard JSON structure if packaged differently
  return (fileData.default ? fileData.default : fileData) as TimelineGameData;
}) as TimelineGameData[];

export function getAllGames(): TimelineGameData[] {
  return games;
}

export function getGame(slug: string): TimelineGameData | undefined {
  return games.find((game) => game.slug === slug);
}

export function getGameSummaries(): PublicGameSummary[] {
  return games.map(({ id, slug, title, shortTitle, description, category, subcategory, sitePath, theme, items }) => ({
    id,
    slug,
    title,
    shortTitle,
    description,
    category,
    subcategory,
    sitePath,
    theme,
    itemCount: items.length
  }));
}
