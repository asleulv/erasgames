const fs = require("fs");
const path = require("path");

const SOURCE_BASE = "https://theyshootzombies.com/ghf1000";
const SOURCE_PAGES = ["1-100", "101-200", "201-300"];
const OUTPUT_PATH = path.join("data", "games", "horror-movies.json");
const LIMIT = 250;

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&#8212;|&mdash;/g, "-")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripAccents(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parsePage(html, sourceUrl) {
  const pattern =
    /<h2>(\d+)\.\s*(?:<span[\s\S]*?<\/span>\s*)?([\s\S]*?)<\/h2>\s*<h4><span[^>]*>([\s\S]*?)<\/span><\/h4>[\s\S]*?<p><strong>(\d{4})\s*\/\s*([^/]+?)\s*\/\s*([^/]+?)\s*\/\s*([^/]+?)\s*\/\s*([^|<]+?)\s*\|\s*<a href="([^"]+)"/g;

  return [...html.matchAll(pattern)].map((match) => {
    const rank = Number(match[1]);
    const title = decodeHtml(match[2]);
    const director = decodeHtml(match[3]);
    const year = Number(match[4]);
    const country = decodeHtml(match[5]);
    const runtime = decodeHtml(match[6]);
    const format = decodeHtml(match[7]);
    const genre = decodeHtml(match[8]);
    const imdb = decodeHtml(match[9]);

    return {
      rank,
      title,
      director,
      year,
      country,
      runtime,
      format,
      genre,
      imdb,
      sourceUrl
    };
  });
}

function popularity(rank) {
  if (rank <= 25) return 100;
  if (rank <= 50) return 95;
  if (rank <= 100) return 88;
  if (rank <= 150) return 78;
  if (rank <= 200) return 68;
  return 58;
}

function makeGame(rows) {
  const items = rows.slice(0, LIMIT).map((row) => ({
    id: `${slugify(row.title)}-${row.year}`,
    label: row.title,
    year: row.year,
    subtitle: `Dir: ${row.director}`,
    description: `#${row.rank} in They Shoot Zombies, Don't They?'s 1,000 Greatest Horror Films. ${row.genre} horror from ${row.country}, ${row.runtime}.`,
    popularity: popularity(row.rank),
    tags: [row.genre, row.country, `TSZDT #${row.rank}`].filter(Boolean),
    source: row.imdb || row.sourceUrl
  }));

  return {
    id: "horror-movies",
    slug: "horror-movies",
    title: "Horror Movies Timeline",
    shortTitle: "Horror",
    description: "Place acclaimed horror movies in their correct release order.",
    category: "Movies & TV",
    subcategory: "Movies",
    sitePath: "/timeline/horror-movies",
    theme: {
      primary: "#B91C1C",
      secondary: "#111111",
      background: "#FFF1F2",
      text: "#111111"
    },
    share: {
      title: "Horror Movies Timeline",
      description: "Can you place these acclaimed horror movies in their correct release order?",
      hashtags: ["HorrorMovies", "MovieQuiz", "TimelineQuiz"]
    },
    seo: {
      title: "Horror Movies Timeline Quiz - Eras Games",
      description:
        "Test your horror movie knowledge. Put acclaimed horror films in their correct release order in this addictive timeline game.",
      keywords: [
        "horror movie quiz",
        "horror timeline",
        "movie timeline game",
        "scary movies quiz",
        "Eras Games"
      ]
    },
    items
  };
}

async function main() {
  const rows = [];

  for (const page of SOURCE_PAGES) {
    const url = `${SOURCE_BASE}/${page}/`;
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
      }
    });
    if (!response.ok) throw new Error(`Could not fetch ${url}: ${response.status}`);
    rows.push(...parsePage(await response.text(), url));
  }

  rows.sort((a, b) => a.rank - b.rank);
  const game = makeGame(rows);
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(game, null, 2)}\n`, "utf8");

  const years = game.items.map((item) => item.year);
  console.log(
    `Wrote ${OUTPUT_PATH} with ${game.items.length} items from TSZDT top ${LIMIT}; years ${Math.min(...years)}-${Math.max(...years)}`
  );
  console.log(`Top 5: ${game.items.slice(0, 5).map((item) => `${item.label} (${item.year})`).join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
