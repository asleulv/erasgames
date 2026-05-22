import { NextResponse } from "next/server";
import pool from "@/lib/db";

const globalForMemoryDb = global as unknown as {
  localMemoryScores: Array<{
    id: number;
    game_id: string;
    username: string;
    score: number;
    date: string;
    timestamp: string;
  }>;
  isDbAvailable: boolean;
  hasCheckedDb: boolean;
};

async function checkDbAvailable(): Promise<boolean> {
  if (globalForMemoryDb.isDbAvailable) return true;
  try {
    const connection = await pool.getConnection();
    connection.release();
    globalForMemoryDb.isDbAvailable = true;
    return true;
  } catch {
    globalForMemoryDb.isDbAvailable = false;
    return false;
  }
}

// GET /api/leaderboard/today
// Returns: { scores: { [gameId]: number } }
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

    const hasDb = await checkDbAvailable();

    if (hasDb) {
      const [rows] = await pool.query(
        `SELECT game_id, MAX(score) AS top_score
         FROM scores
         WHERE date = ?
         GROUP BY game_id;`,
        [date]
      ) as [Array<{ game_id: string; top_score: number }>, unknown];

      const scores: Record<string, number> = {};
      for (const row of rows) {
        scores[row.game_id] = row.top_score;
      }

      return NextResponse.json({ scores });
    } else {
      // In-memory fallback
      const scores: Record<string, number> = {};
      for (const entry of (globalForMemoryDb.localMemoryScores ?? [])) {
        if (entry.date === date) {
          if (scores[entry.game_id] === undefined || entry.score > scores[entry.game_id]) {
            scores[entry.game_id] = entry.score;
          }
        }
      }
      return NextResponse.json({ scores });
    }
  } catch (error) {
    console.error("Failed to fetch today's scores", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
