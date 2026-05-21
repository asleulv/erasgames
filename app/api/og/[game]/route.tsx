import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getGame } from "@/lib/games";

export const runtime = "edge";

export async function GET(_request: Request, { params }: { params: Promise<{ game: string }> }) {
  const { game: slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "76px",
          background: game.theme.secondary,
          color: "#fffaf0"
        }}
      >
        <div style={{ display: "flex", color: game.theme.primary, fontSize: 34, fontWeight: 900 }}>Eras Games</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 900, lineHeight: 0.98 }}>{game.title}</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 34, maxWidth: 850 }}>
            {game.share.description}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: game.theme.primary }}>
          Play at erasgames.com{game.sitePath}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
