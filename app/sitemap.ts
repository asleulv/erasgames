import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getAllGames } from "@/lib/games";
import { siteConfig } from "@/lib/site";

function gameLastModified(slug: string): Date {
  try {
    const filePath = path.join(process.cwd(), "data", "games", `${slug}.json`);
    return fs.statSync(filePath).mtime;
  } catch {
    return new Date("2025-01-01");
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...getAllGames().map((game) => ({
      url: `${siteConfig.url}${game.sitePath}`,
      lastModified: gameLastModified(game.slug),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
