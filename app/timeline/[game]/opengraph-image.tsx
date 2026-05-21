import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getGame } from "@/lib/games";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

type OgImageProps = {
  params: Promise<{ game: string }>;
};

export default async function Image({ params }: OgImageProps) {
  const { game: slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 76,
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
    size
  );
}
