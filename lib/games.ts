import arsenal from "@/data/games/arsenal.json";
import astonVilla from "@/data/games/aston-villa.json";
import bournemouth from "@/data/games/bournemouth.json";
import brentford from "@/data/games/brentford.json";
import brighton from "@/data/games/brighton.json";
import burnley from "@/data/games/burnley.json";
import chelsea from "@/data/games/chelsea.json";
import crystalPalace from "@/data/games/crystal-palace.json";
import everton from "@/data/games/everton.json";
import fulham from "@/data/games/fulham.json";
import leeds from "@/data/games/leeds.json";
import liverpool from "@/data/games/liverpool.json";
import manCity from "@/data/games/man-city.json";
import manUnited from "@/data/games/man-united.json";
import newcastle from "@/data/games/newcastle.json";
import nottinghamForest from "@/data/games/nottingham-forest.json";
import sunderland from "@/data/games/sunderland.json";
import tottenham from "@/data/games/tottenham.json";
import westHam from "@/data/games/west-ham.json";
import wolves from "@/data/games/wolves.json";

import type { PublicGameSummary, TimelineGameData } from "@/lib/timeline-types";

const games = [
  wolves,
  arsenal,
  astonVilla,
  bournemouth,
  brentford,
  brighton,
  burnley,
  chelsea,
  crystalPalace,
  everton,
  fulham,
  leeds,
  liverpool,
  manCity,
  manUnited,
  newcastle,
  nottinghamForest,
  sunderland,
  tottenham,
  westHam
] as TimelineGameData[];

export function getAllGames(): TimelineGameData[] {
  return games;
}

export function getGame(slug: string): TimelineGameData | undefined {
  return games.find((game) => game.slug === slug);
}

export function getGameSummaries(): PublicGameSummary[] {
  return games.map(({ id, slug, title, shortTitle, description, category, sitePath, theme }) => ({
    id,
    slug,
    title,
    shortTitle,
    description,
    category,
    sitePath,
    theme
  }));
}
