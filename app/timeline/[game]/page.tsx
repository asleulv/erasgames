import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TimelineGame } from "@/components/TimelineGame";
import { getAllGames, getGame } from "@/lib/games";
import { siteConfig } from "@/lib/site";

type GamePageProps = {
  params: Promise<{ game: string }>;
};

export function generateStaticParams() {
  return getAllGames().map((game) => ({ game: game.slug }));
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { game: slug } = await params;
  const game = getGame(slug);
  if (!game) return {};

  return {
    title: game.seo.title,
    description: game.seo.description,
    keywords: game.seo.keywords,
    alternates: {
      canonical: game.sitePath
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: game.share.title,
      description: game.share.description,
      url: game.sitePath,
      images: [{ url: `/api/og/${game.slug}`, width: 1200, height: 630 }]
    },
    twitter: {
      card: "summary_large_image",
      title: game.share.title,
      description: game.share.description,
      images: [`/api/og/${game.slug}`]
    }
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { game: slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: game.title,
    description: game.description,
    url: `${siteConfig.url}${game.sitePath}`,
    genre: "Timeline quiz",
    gamePlatform: "Web browser",
    inLanguage: "en"
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <TimelineGame game={game} />
    </main>
  );
}
