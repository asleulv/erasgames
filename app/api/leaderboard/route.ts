import { NextResponse } from "next/server";
import pool from "@/lib/db";

let isInitialized = false;

async function ensureTableExists() {
  if (isInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        game_id VARCHAR(50) NOT NULL,
        username VARCHAR(24) NOT NULL,
        score INT NOT NULL,
        date VARCHAR(10) NOT NULL,
        timestamp VARCHAR(30) NOT NULL,
        UNIQUE KEY unique_user_game_date (game_id, username, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize database table:", error);
    throw error;
  }
}

// In-memory fallback types and state
interface ScoreEntry {
  id: number;
  game_id: string;
  username: string;
  score: number;
  date: string;
  timestamp: string;
}

const globalForMemoryDb = global as unknown as {
  localMemoryScores: ScoreEntry[];
  nextId: number;
  isDbAvailable: boolean;
  hasCheckedDb: boolean;
};

if (!globalForMemoryDb.localMemoryScores) {
  globalForMemoryDb.localMemoryScores = [];
  globalForMemoryDb.nextId = 1;
  globalForMemoryDb.isDbAvailable = false;
  globalForMemoryDb.hasCheckedDb = false;
}

async function checkDbAvailable(): Promise<boolean> {
  if (globalForMemoryDb.isDbAvailable) return true;
  try {
    const connection = await pool.getConnection();
    connection.release();
    globalForMemoryDb.isDbAvailable = true;
    globalForMemoryDb.hasCheckedDb = true;
    return true;
  } catch (e) {
    if (!globalForMemoryDb.hasCheckedDb) {
      console.warn(
        "⚠️ MySQL Database is not running or accessible. Leaderboard will run in in-memory fallback mode. Error details:",
        e
      );
      globalForMemoryDb.hasCheckedDb = true;
    }
    globalForMemoryDb.isDbAvailable = false;
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const date = searchParams.get("date");
    const allTime = searchParams.get("allTime") === "true";

    if (!gameId) {
      return NextResponse.json({ error: "Missing gameId" }, { status: 400 });
    }

    const hasDb = await checkDbAvailable();

    if (hasDb) {
      await ensureTableExists();

      if (allTime) {
        // Find each unique user's max score, with the earliest timestamp and date they achieved it
        const [rows] = await pool.query(
          `SELECT s.username, s.score, MIN(s.timestamp) AS timestamp, MIN(s.date) AS date
           FROM scores s
           INNER JOIN (
             SELECT username, MAX(score) AS max_score
             FROM scores
             WHERE game_id = ?
             GROUP BY username
           ) m ON s.username = m.username AND s.score = m.max_score
           WHERE s.game_id = ?
           GROUP BY s.username, s.score
           ORDER BY s.score DESC, timestamp ASC
           LIMIT 50;`,
          [gameId, gameId]
        );
        return NextResponse.json({ scores: rows });
      }

      if (date) {
        const [rows] = await pool.query(
          `SELECT username, score, timestamp
           FROM scores
           WHERE game_id = ? AND date = ?
           ORDER BY score DESC, timestamp ASC
           LIMIT 50;`,
          [gameId, date]
        );
        return NextResponse.json({ scores: rows });
      }
    } else {
      // In-memory fallback
      const filtered = globalForMemoryDb.localMemoryScores.filter(
        (s) => s.game_id === gameId
      );

      if (allTime) {
        const userMaxScores: { [username: string]: ScoreEntry } = {};
        for (const s of filtered) {
          const u = s.username.toLowerCase();
          if (!userMaxScores[u] || s.score > userMaxScores[u].score) {
            userMaxScores[u] = s;
          } else if (s.score === userMaxScores[u].score) {
            if (
              new Date(s.timestamp).getTime() <
              new Date(userMaxScores[u].timestamp).getTime()
            ) {
              userMaxScores[u] = s;
            }
          }
        }
        const rows = Object.values(userMaxScores)
          .sort(
            (a, b) =>
              b.score - a.score ||
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .slice(0, 50)
          .map((s) => ({
            username: s.username,
            score: s.score,
            timestamp: s.timestamp,
            date: s.date,
          }));
        return NextResponse.json({ scores: rows });
      }

      if (date) {
        const rows = filtered
          .filter((s) => s.date === date)
          .sort(
            (a, b) =>
              b.score - a.score ||
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .slice(0, 50)
          .map((s) => ({
            username: s.username,
            score: s.score,
            timestamp: s.timestamp,
          }));
        return NextResponse.json({ scores: rows });
      }
    }

    return NextResponse.json({ error: "Specify date or allTime" }, { status: 400 });
  } catch (error) {
    console.error("Failed to read leaderboard", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { gameId, username, score, date } = body;

    if (!gameId || !username || score === undefined || !date) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const cleanUsername = username.trim().substring(0, 24) || "Anonymous";
    const timestamp = new Date().toISOString();

    const hasDb = await checkDbAvailable();

    if (hasDb) {
      await ensureTableExists();

      // Insert score. If they already submitted today, update it ONLY if the new score is higher.
      await pool.query(
        `INSERT INTO scores (game_id, username, score, date, timestamp)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           timestamp = IF(VALUES(score) > score, VALUES(timestamp), timestamp),
           score = IF(VALUES(score) > score, VALUES(score), score);`,
        [gameId, cleanUsername, score, date, timestamp]
      );

      // Fetch updated daily scores to return to client
      const [rows] = await pool.query(
        `SELECT username, score, timestamp
         FROM scores
         WHERE game_id = ? AND date = ?
         ORDER BY score DESC, timestamp ASC
         LIMIT 50;`,
        [gameId, date]
      );

      return NextResponse.json({ success: true, scores: rows });
    } else {
      // In-memory fallback
      const existingIndex = globalForMemoryDb.localMemoryScores.findIndex(
        (s) =>
          s.game_id === gameId &&
          s.username.toLowerCase() === cleanUsername.toLowerCase() &&
          s.date === date
      );

      if (existingIndex >= 0) {
        const existing = globalForMemoryDb.localMemoryScores[existingIndex];
        if (score > existing.score) {
          globalForMemoryDb.localMemoryScores[existingIndex] = {
            ...existing,
            score,
            timestamp,
          };
        }
      } else {
        globalForMemoryDb.localMemoryScores.push({
          id: globalForMemoryDb.nextId++,
          game_id: gameId,
          username: cleanUsername,
          score,
          date,
          timestamp,
        });
      }

      const rows = globalForMemoryDb.localMemoryScores
        .filter((s) => s.game_id === gameId && s.date === date)
        .sort(
          (a, b) =>
            b.score - a.score ||
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        .slice(0, 50)
        .map((s) => ({
          username: s.username,
          score: s.score,
          timestamp: s.timestamp,
        }));

      return NextResponse.json({ success: true, scores: rows });
    }
  } catch (error) {
    console.error("Failed to save score", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
