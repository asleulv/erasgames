import Link from "next/link";
import { getGameSummaries } from "@/lib/games";

function getLum(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Card background: always use the team's primary color */
function cardBg(primary: string): string {
  return primary;
}

/** On light card backgrounds use dark text, on dark backgrounds use white */
function cardText(bgHex: string): string {
  return getLum(bgHex) > 0.40 ? "#101820" : "#ffffff";
}

/** Top-border accent: simply the other color of the two identity colors */
function cardAccent(primary: string, secondary: string, bg: string): string {
  return bg === primary ? secondary : primary;
}

export default function HomePage() {
  const games = getGameSummaries();

  return (
    <main className="home-page">
      <section className="home-hero">
        <p className="eyebrow">Eras Games</p>
        <h1>Timeline games for every era worth arguing about.</h1>
        <p>
          Build streaks by placing players, songs, people, and moments in the right chronological order.
        </p>
      </section>

      <section className="game-list" aria-label="Available games">
        {games.map((game) => (
          <Link
            className="game-link"
            href={game.sitePath}
            key={game.id}
            style={
              (() => {
                const bg = cardBg(game.theme.primary);
                const isLight = getLum(bg) > 0.45;
                const bgEnd = isLight
                  ? `color-mix(in srgb, ${bg} 93%, #000000)` // soft silver-grey for white/light cards
                  : `color-mix(in srgb, ${bg} 82%, #000000)`; // deep rich gradient end for dark cards

                return {
                  "--game-primary": game.theme.primary,
                  "--game-secondary": game.theme.secondary,
                  "--game-card-bg": bg,
                  "--game-card-bg-end": bgEnd,
                  "--game-card-text": cardText(bg),
                  "--game-card-accent": cardAccent(game.theme.primary, game.theme.secondary, bg),
                } as React.CSSProperties;
              })()
            }
          >
            <div className="game-card-content">
              <span className="game-card-category">{game.category}</span>
              <h2>{game.title}</h2>
              <p>{game.description}</p>
            </div>
            <div className="game-card-action">
              <span>Play Now</span>
              <span className="arrow">&rarr;</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
