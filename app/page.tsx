import type { Metadata } from "next";
import { getGameSummaries, getAllGames } from "@/lib/games";
import { siteConfig } from "@/lib/site";
import HomePageClient from "@/components/HomePageClient";

export const metadata: Metadata = {
  title: {
    absolute: "Eras Games – Free Online Timeline Quiz Games",
  },
  description:
    "Put football transfers, movie releases, and TV shows in the right chronological order. Free online timeline quiz games for football fans and pop culture lovers.",
  keywords: [
    "timeline quiz",
    "football quiz",
    "Premier League quiz",
    "football transfers quiz",
    "sports trivia game",
    "movie quiz",
    "TV show quiz",
    "chronological order game",
    "free quiz game",
    "online quiz game",
    "Arsenal quiz",
    "Liverpool quiz",
    "Manchester United quiz",
  ],
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: "Eras Games – Simple, yet addictive timeline quiz games",
    description:
      "Put football transfers, movies, and TV shows in the right chronological order. Free online quiz games for fans of the beautiful game and pop culture.",
    url: siteConfig.url,
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eras Games – Free Timeline Quiz Games",
    description:
      "Put football transfers, movies, and TV shows in the right chronological order. Free online quiz games.",
    images: ["/opengraph-image"],
  },
};

export default function HomePage() {
  const games = getGameSummaries();
  const allGames = getAllGames();

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description:
      "Free online timeline quiz games covering football transfers, movie releases, and TV shows.",
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Timeline Quiz Games",
    description: "A collection of free online timeline quiz games",
    itemListElement: allGames.map((game, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Game",
        name: game.title,
        description: game.seo.description,
        url: `${siteConfig.url}${game.sitePath}`,
        genre: "Timeline quiz",
        gamePlatform: "Web browser",
        inLanguage: "en",
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <HomePageClient games={games} />
    </>
  );
}
