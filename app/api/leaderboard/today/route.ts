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
// Returns: { scores: { [gameId]: { score: number, username: string } } }
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
        `SELECT s.game_id, s.score AS top_score, s.username
         FROM scores s
         INNER JOIN (
           SELECT game_id, MAX(score) AS max_score
           FROM scores
           WHERE date = ?
           GROUP BY game_id
         ) m ON s.game_id = m.game_id AND s.score = m.max_score
         WHERE s.date = ?
         GROUP BY s.game_id, s.score, s.username;`,
        [date, date]
      ) as [Array<{ game_id: string; top_score: number; username: string }>, unknown];

      const scores: Record<string, { score: number; username: string }> = {};
      for (const row of rows) {
        scores[row.game_id] = { score: row.top_score, username: row.username };
      }

      return NextResponse.json({ scores });
    } else {
      // In-memory fallback
      const best: Record<string, { score: number; username: string }> = {};
      for (const entry of (globalForMemoryDb.localMemoryScores ?? [])) {
        if (entry.date === date) {
          if (!best[entry.game_id] || entry.score > best[entry.game_id].score) {
            best[entry.game_id] = { score: entry.score, username: entry.username };
          }
        }
      }
      return NextResponse.json({ scores: best });
    }
  } catch (error) {
    console.error("Failed to fetch today's scores", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
