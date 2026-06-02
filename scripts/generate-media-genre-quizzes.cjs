const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join("data", "games");
const RT_SCI_FI = "https://editorial.rottentomatoes.com/guide/essential-sci-fi-movies-of-all-time/";
const RT_ANIMATION = "https://editorial.rottentomatoes.com/guide/100-best-animated-movies/";
const LIST_OBSESSION_REALITY = "https://www.listobsession.com/?p=11204";
const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";

const SCI_FI_EXCLUDED_TITLES = new Set([
  "Eternal Sunshine of the Spotless Mind"
]);

const REALITY_TV_EXCLUDED_TITLES = new Set([
  "Arkadas Canlisi",
  "The Chair",
  "TruTV"
]);

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&#8212;|&mdash;/g, "-")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function popularity(index) {
  if (index < 20) return 100;
  if (index < 50) return 92;
  if (index < 100) return 82;
  if (index < 150) return 70;
  return 58;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "ErasGames timeline dataset generator (https://erasgames.com)" }
  });
  if (!response.ok) throw new Error(`Could not fetch ${url}: ${response.status}`);
  return response.text();
}

function parseRottenTomatoesGuide(html, sourceUrl) {
  return html
    .split(/(?=<div id="countdown-index-)/)
    .filter((part) => part.startsWith('<div id="countdown-index-'))
    .map((block) => {
      const rank = Number(decodeHtml((block.match(/<span class="indicator">#([^<]+)/) || [])[1]));
      const label = decodeHtml((block.match(/<a class="meta-title"[^>]*>([\s\S]*?)<\/a>/) || [])[1]);
      const year = Number((block.match(/<span class='meta-year'>\((\d{4})\)<\/span>/) || [])[1]);
      const director = decodeHtml((block.match(/Directed By:[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/) || [])[1]);
      const synopsis = decodeHtml((block.match(/<span class="title">Synopsis:<\/span>([\s\S]*?)<\/p>/) || [])[1]);
      const source = decodeHtml((block.match(/<a class="meta-title" href="([^"]+)"/) || [])[1]) || sourceUrl;

      if (!rank || !label || !year) return null;
      return {
        rank,
        label,
        year,
        subtitle: director ? `Dir: ${director}` : undefined,
        description: synopsis || `Included in Rotten Tomatoes' essential guide.`,
        source
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank);
}

function makeMovieGame(config, rows) {
  const seen = new Set();
  const items = [];

  for (const row of rows) {
    const id = `${slugify(row.label)}-${row.year}`;
    if (seen.has(id)) continue;
    seen.add(id);

    items.push({
      id,
      label: row.label,
      year: row.year,
      subtitle: row.subtitle,
      description: row.description,
      popularity: popularity(items.length),
      tags: row.tags || [],
      source: row.source
    });
  }

  return {
    id: config.id,
    slug: config.slug,
    title: config.title,
    shortTitle: config.shortTitle,
    description: config.description,
    category: "Movies & TV",
    subcategory: "Movies",
    sitePath: `/timeline/${config.slug}`,
    theme: config.theme,
    share: {
      title: config.title,
      description: config.shareDescription,
      hashtags: config.hashtags
    },
    seo: {
      title: `${config.title} Quiz - Eras Games`,
      description: config.seoDescription,
      keywords: config.keywords
    },
    items
  };
}

async function generateSciFi() {
  const rows = parseRottenTomatoesGuide(await fetchText(RT_SCI_FI), RT_SCI_FI)
    .filter((row) => !SCI_FI_EXCLUDED_TITLES.has(row.label))
    .slice(0, 150);
  return makeMovieGame(
    {
      id: "sci-fi-movies",
      slug: "sci-fi-movies",
      title: "Sci-Fi Movies Timeline",
      shortTitle: "Sci-Fi",
      description: "Place essential science fiction movies in their correct release order.",
      shareDescription: "Can you place these essential sci-fi movies in their correct release order?",
      seoDescription:
        "Test your science fiction movie knowledge. Put essential sci-fi films in their correct release order in this addictive timeline game.",
      hashtags: ["SciFiMovies", "MovieQuiz", "TimelineQuiz"],
      keywords: ["sci-fi movie quiz", "science fiction movies", "movie timeline game", "Eras Games"],
      theme: { primary: "#2563EB", secondary: "#111827", background: "#EEF5FF", text: "#111827" }
    },
    rows
  );
}

async function generateAnimation() {
  const movieClassics = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, "movie-classics.json"), "utf8"));
  const classicAnimation = movieClassics.items
    .filter((item) => item.tags?.some((tag) => /animation/i.test(tag)))
    .map((item) => ({
      label: item.label,
      year: item.year,
      subtitle: item.subtitle,
      description: item.description,
      tags: item.tags,
      source: "data/games/movie-classics.json"
    }));
  const rtAnimation = parseRottenTomatoesGuide(await fetchText(RT_ANIMATION), RT_ANIMATION);
  const rows = [...classicAnimation, ...rtAnimation].slice(0, 120);

  return makeMovieGame(
    {
      id: "animated-movies",
      slug: "animated-movies",
      title: "Animated Movies Timeline",
      shortTitle: "Animation",
      description: "Place acclaimed animated movies in their correct release order.",
      shareDescription: "Can you place these acclaimed animated movies in their correct release order?",
      seoDescription:
        "Test your animated movie knowledge. Put acclaimed animated films in their correct release order in this addictive timeline game.",
      hashtags: ["AnimatedMovies", "MovieQuiz", "TimelineQuiz"],
      keywords: ["animated movie quiz", "animation movies", "movie timeline game", "Eras Games"],
      theme: { primary: "#F59E0B", secondary: "#1F2937", background: "#FFF7ED", text: "#1F2937" }
    },
    rows
  );
}

async function sparql(query) {
  const response = await fetch(`${WIKIDATA_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`, {
    headers: {
      accept: "application/sparql-results+json",
      "user-agent": "ErasGames timeline dataset generator (https://erasgames.com)"
    }
  });
  if (!response.ok) throw new Error(`Wikidata query failed: ${response.status}`);
  return response.json();
}

async function generateSitcoms() {
  const query = `
    SELECT ?item ?itemLabel (MIN(YEAR(?date)) AS ?year) (SAMPLE(?creatorLabel) AS ?creator) ?sitelinks WHERE {
      ?item wdt:P31 wd:Q5398426;
            wdt:P136 wd:Q170238;
            wikibase:sitelinks ?sitelinks.
      OPTIONAL { ?item wdt:P571 ?inception. }
      OPTIONAL { ?item wdt:P580 ?startTime. }
      OPTIONAL { ?item wdt:P577 ?publication. }
      OPTIONAL { ?item wdt:P170 ?creator. }
      BIND(COALESCE(?inception, ?startTime, ?publication) AS ?date)
      FILTER(BOUND(?date))
      FILTER(YEAR(?date) >= 1940 && YEAR(?date) <= 2026)
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". ?item rdfs:label ?itemLabel. ?creator rdfs:label ?creatorLabel. }
    }
    GROUP BY ?item ?itemLabel ?sitelinks
    ORDER BY DESC(?sitelinks)
    LIMIT 220
  `;
  const data = await sparql(query);
  const items = [];
  const seen = new Set();

  for (const row of data.results.bindings) {
    const label = row.itemLabel?.value;
    const year = Number(row.year?.value);
    if (!label || /^Q\d+$/.test(label) || !Number.isFinite(year)) continue;
    const id = `${slugify(label)}-${year}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const creator = row.creator?.value;
    items.push({
      id,
      label,
      year,
      subtitle: creator && !/^Q\d+$/.test(creator) ? `Created by: ${creator}` : undefined,
      description: `${label} premiered in ${year}. Ranked by Wikidata notability signals for this timeline dataset.`,
      popularity: popularity(items.length),
      tags: [`Wikidata sitelinks: ${row.sitelinks?.value || 0}`],
      source: row.item?.value
    });
    if (items.length >= 150) break;
  }

  return {
    id: "sitcoms",
    slug: "sitcoms",
    title: "Sitcoms Timeline",
    shortTitle: "Sitcoms",
    description: "Place iconic sitcoms in their correct premiere order.",
    category: "Movies & TV",
    subcategory: "TV Shows",
    sitePath: "/timeline/sitcoms",
    theme: { primary: "#10B981", secondary: "#111827", background: "#ECFDF5", text: "#111827" },
    share: {
      title: "Sitcoms Timeline",
      description: "Can you place these iconic sitcoms in their correct premiere order?",
      hashtags: ["Sitcoms", "TVQuiz", "TimelineQuiz"]
    },
    seo: {
      title: "Sitcoms Timeline Quiz - Eras Games",
      description: "Test your sitcom knowledge. Put iconic comedy TV series in their correct premiere order in this addictive timeline game.",
      keywords: ["sitcom quiz", "TV comedy quiz", "TV timeline game", "Eras Games"]
    },
    items
  };
}

async function generateRealityTV() {
  const html = await fetchText(LIST_OBSESSION_REALITY);
  const lines = html
    .replace(/<[^>]+>/g, "\n")
    .replace(/&#8217;|&rsquo;|’/g, "'")
    .replace(/&#8211;|&ndash;|–/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .split(/\n+/)
    .map((line) => decodeHtml(line))
    .filter(Boolean);

  const startIndex = lines.findIndex((line) => line === "Survivor");
  if (startIndex < 0) throw new Error("Could not find Reality TV list start");

  const items = [];
  const seen = new Set();

  for (let index = startIndex; index < lines.length - 1; index += 1) {
    const label = lines[index];
    const yearsText = lines[index + 1];
    const year = Number((yearsText.match(/\((\d{4})/) || [])[1]);
    if (!label || /^Q\d+$/.test(label) || REALITY_TV_EXCLUDED_TITLES.has(label) || !Number.isFinite(year)) continue;
    const id = `${slugify(label)}-${year}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const rank = items.length + 1;
    items.push({
      id,
      label,
      year,
      subtitle: "Reality TV",
      description: `#${rank} in List Obsession's aggregated Best TV Reality Shows of All Time list, compiled from 28 ranked lists.`,
      popularity: popularity(items.length),
      tags: [`List Obsession #${rank}`, yearsText],
      source: LIST_OBSESSION_REALITY
    });
    index += 1;
    if (items.length >= 120) break;
  }

  return {
    id: "reality-tv",
    slug: "reality-tv",
    title: "Reality TV Timeline",
    shortTitle: "Reality TV",
    description: "Place iconic reality TV shows in their correct premiere order.",
    category: "Movies & TV",
    subcategory: "TV Shows",
    sitePath: "/timeline/reality-tv",
    theme: { primary: "#EC4899", secondary: "#18181B", background: "#FDF2F8", text: "#18181B" },
    share: {
      title: "Reality TV Timeline",
      description: "Can you place these iconic reality TV shows in their correct premiere order?",
      hashtags: ["RealityTV", "TVQuiz", "TimelineQuiz"]
    },
    seo: {
      title: "Reality TV Timeline Quiz - Eras Games",
      description: "Test your reality TV knowledge. Put iconic reality shows in their correct premiere order in this addictive timeline game.",
      keywords: ["reality TV quiz", "reality show quiz", "TV timeline game", "Eras Games"]
    },
    items
  };
}

async function main() {
  const games = [await generateSciFi(), await generateAnimation(), await generateSitcoms(), await generateRealityTV()];
  for (const game of games) {
    const outputPath = path.join(OUTPUT_DIR, `${game.slug}.json`);
    fs.writeFileSync(outputPath, `${JSON.stringify(game, null, 2)}\n`, "utf8");
    const years = game.items.map((item) => item.year);
    console.log(`${game.slug}: ${game.items.length} items, years ${Math.min(...years)}-${Math.max(...years)}`);
    console.log(`  ${game.items.slice(0, 8).map((item) => `${item.label} (${item.year})`).join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
