import type { MetadataRoute } from "next";
import { getAllGames } from "@/lib/games";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    ...getAllGames().map((game) => ({
      url: `${siteConfig.url}${game.sitePath}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}
