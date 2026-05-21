const fs = require("fs");
const path = require("path");

const START_YEAR = 1992;
const END_YEAR = 2025;
const BASE_URL = "https://raw.githubusercontent.com/eordo/transfermarkt-data/master/premier_league";
const OUTPUT_DIR = path.join("data", "games");
const SKIP_SLUGS = new Set(["wolves"]);

const CLUBS = {
  "AFC Bournemouth": {
    slug: "bournemouth",
    shortTitle: "Bournemouth",
    title: "Bournemouth Timeline",
    clubName: "AFC Bournemouth",
    primary: "#DA291C",
    secondary: "#000000",
    background: "#FFF4F2"
  },
  "Arsenal FC": {
    slug: "arsenal",
    shortTitle: "Arsenal",
    title: "Arsenal Timeline",
    clubName: "Arsenal",
    primary: "#EF0107",
    secondary: "#063672",
    background: "#FFF5F2"
  },
  "Aston Villa": {
    slug: "aston-villa",
    shortTitle: "Aston Villa",
    title: "Aston Villa Timeline",
    clubName: "Aston Villa",
    primary: "#95BFE5",
    secondary: "#670E36",
    background: "#F2F8FC"
  },
  "Brentford FC": {
    slug: "brentford",
    shortTitle: "Brentford",
    title: "Brentford Timeline",
    clubName: "Brentford",
    primary: "#E30613",
    secondary: "#111111",
    background: "#FFF4F4"
  },
  "Brighton & Hove Albion": {
    slug: "brighton",
    shortTitle: "Brighton",
    title: "Brighton Timeline",
    clubName: "Brighton & Hove Albion",
    primary: "#0057B8",
    secondary: "#FFFFFF",
    background: "#F1F7FF",
    text: "#101820"
  },
  "Burnley FC": {
    slug: "burnley",
    shortTitle: "Burnley",
    title: "Burnley Timeline",
    clubName: "Burnley",
    primary: "#6C1D45",
    secondary: "#99D6EA",
    background: "#FFF3F8",
    text: "#24111B"
  },
  "Chelsea FC": {
    slug: "chelsea",
    shortTitle: "Chelsea",
    title: "Chelsea Timeline",
    clubName: "Chelsea",
    primary: "#034694",
    secondary: "#DBA111",
    background: "#F1F6FF"
  },
  "Crystal Palace": {
    slug: "crystal-palace",
    shortTitle: "Crystal Palace",
    title: "Crystal Palace Timeline",
    clubName: "Crystal Palace",
    primary: "#1B458F",
    secondary: "#C4122E",
    background: "#F2F6FF"
  },
  "Everton FC": {
    slug: "everton",
    shortTitle: "Everton",
    title: "Everton Timeline",
    clubName: "Everton",
    primary: "#003399",
    secondary: "#FFFFFF",
    background: "#F1F5FF",
    text: "#101820"
  },
  "Fulham FC": {
    slug: "fulham",
    shortTitle: "Fulham",
    title: "Fulham Timeline",
    clubName: "Fulham",
    primary: "#FFFFFF",
    secondary: "#CC0000",
    background: "#F8F8F8",
    text: "#101820"
  },
  "Leeds United": {
    slug: "leeds",
    shortTitle: "Leeds",
    title: "Leeds Timeline",
    clubName: "Leeds United",
    primary: "#FFCD00",
    secondary: "#1D428A",
    background: "#FFFBEA"
  },
  "Liverpool FC": {
    slug: "liverpool",
    shortTitle: "Liverpool",
    title: "Liverpool Timeline",
    clubName: "Liverpool",
    primary: "#C8102E",
    secondary: "#00B2A9",
    background: "#FFF3F5",
    text: "#101820"
  },
  "Manchester City": {
    slug: "man-city",
    shortTitle: "Man City",
    title: "Man City Timeline",
    clubName: "Manchester City",
    primary: "#6CABDD",
    secondary: "#1C2C5B",
    background: "#F1F9FF"
  },
  "Manchester United": {
    slug: "man-united",
    shortTitle: "Man United",
    title: "Man United Timeline",
    clubName: "Manchester United",
    primary: "#DA291C",
    secondary: "#FBE122",
    background: "#FFF4F2",
    text: "#111111"
  },
  "Newcastle United": {
    slug: "newcastle",
    shortTitle: "Newcastle",
    title: "Newcastle Timeline",
    clubName: "Newcastle United",
    primary: "#241F20",
    secondary: "#FFFFFF",
    background: "#F4F4F4",
    text: "#111111"
  },
  "Nottingham Forest": {
    slug: "nottingham-forest",
    shortTitle: "Forest",
    title: "Nottingham Forest Timeline",
    clubName: "Nottingham Forest",
    primary: "#DD0000",
    secondary: "#FFFFFF",
    background: "#FFF4F4",
    text: "#111111"
  },
  "Sunderland AFC": {
    slug: "sunderland",
    shortTitle: "Sunderland",
    title: "Sunderland Timeline",
    clubName: "Sunderland",
    primary: "#EB172B",
    secondary: "#111111",
    background: "#FFF4F5"
  },
  "Tottenham Hotspur": {
    slug: "tottenham",
    shortTitle: "Tottenham",
    title: "Tottenham Timeline",
    clubName: "Tottenham Hotspur",
    primary: "#132257",
    secondary: "#FFFFFF",
    background: "#F5F7FF",
    text: "#101820"
  },
  "West Ham United": {
    slug: "west-ham",
    shortTitle: "West Ham",
    title: "West Ham Timeline",
    clubName: "West Ham United",
    primary: "#7A263A",
    secondary: "#1BB1E7",
    background: "#FFF3F6"
  },
  "Wolverhampton Wanderers": {
    slug: "wolves",
    shortTitle: "Wolves",
    title: "Wolves Timeline",
    clubName: "Wolverhampton Wanderers",
    primary: "#FDB913",
    secondary: "#171511",
    background: "#FFF8E5"
  }
};

const MANUAL_BOOSTS = {
  "Arsenal FC": {
    "Dennis Bergkamp": 100,
    "Patrick Vieira": 100,
    "Thierry Henry": 100,
    "Sol Campbell": 100,
    "Robert Pires": 95,
    "Cesc Fàbregas": 100,
    "Robin van Persie": 100,
    "Mesut Özil": 100,
    "Alexis Sánchez": 100,
    "Pierre-Emerick Aubameyang": 100,
    "Martin Ødegaard": 100,
    "Declan Rice": 100
  },
  "Chelsea FC": {
    "Didier Drogba": 100,
    "Eden Hazard": 100,
    "Frank Lampard": 100,
    "Claude Makélélé": 95,
    "N'Golo Kanté": 100,
    "Fernando Torres": 95
  },
  "Liverpool FC": {
    "Mohamed Salah": 100,
    "Sadio Mané": 100,
    "Virgil van Dijk": 100,
    "Alisson": 95,
    "Luis Suárez": 100,
    "Fernando Torres": 100
  },
  "Manchester City": {
    "Sergio Agüero": 100,
    "David Silva": 100,
    "Yaya Touré": 100,
    "Kevin De Bruyne": 100,
    "Erling Haaland": 100
  },
  "Manchester United": {
    "Eric Cantona": 100,
    "Cristiano Ronaldo": 100,
    "Wayne Rooney": 100,
    "Rio Ferdinand": 95,
    "Robin van Persie": 100,
    "Bruno Fernandes": 95
  },
  "Tottenham Hotspur": {
    "Gareth Bale": 100,
    "Luka Modric": 100,
    "Son Heung-min": 100,
    "Rafael van der Vaart": 95,
    "Dimitar Berbatov": 95
  }
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const headers = rows.shift();
  return rows
    .filter((candidate) => candidate.length === headers.length)
    .map((candidate) => Object.fromEntries(headers.map((header, index) => [header, candidate[index]])));
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function signedYear(row) {
  return Number(row.window === "winter" ? Number(row.season) + 1 : row.season);
}

function getPopularity(club, row) {
  const fee = Number(row.fee || 0) || 0;
  const marketValue = Number(row.market_value || 0) || 0;
  const money = Math.max(fee, marketValue);
  let score = 45;

  if (money >= 100000000) score = 100;
  else if (money >= 60000000) score = 95;
  else if (money >= 40000000) score = 88;
  else if (money >= 20000000) score = 75;

  return Math.max(score, MANUAL_BOOSTS[club]?.[row.player_name] || 0);
}

function isBadSourceClub(club, sourceClub) {
  if (!sourceClub || /^Unknown$/i.test(sourceClub) || /Without Club/i.test(sourceClub)) return true;
  const escapedClub = club.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escapedClub}\\s+(U18|U21|U23|Youth|Academy)|${escapedClub} U18|${escapedClub} U21|${escapedClub} U23`, "i").test(
    sourceClub
  );
}

function removeMultiYearDuplicates(items) {
  const yearsByLabel = new Map();
  for (const item of items) {
    const key = item.label.toLocaleLowerCase("en-US");
    if (!yearsByLabel.has(key)) yearsByLabel.set(key, new Set());
    yearsByLabel.get(key).add(item.year);
  }

  return items.filter((item) => {
    const key = item.label.toLocaleLowerCase("en-US");
    return yearsByLabel.get(key).size === 1;
  });
}

function makeGame(club, rows) {
  const meta = CLUBS[club] || {
    slug: slugify(club.replace(/\s+FC$/, "")),
    shortTitle: club.replace(/\s+FC$/, ""),
    title: `${club.replace(/\s+FC$/, "")} Timeline`,
    clubName: club.replace(/\s+FC$/, ""),
    primary: "#111111",
    secondary: "#F5F5F5",
    background: "#F8F8F8",
    text: "#111111"
  };

  const items = removeMultiYearDuplicates(
    rows
      .filter((row) => row.movement === "in" && String(row.is_loan) === "0" && !isBadSourceClub(club, row.dealing_club))
      .map((row) => {
        const year = signedYear(row);
        const fromClub = row.dealing_club;
        return {
          id: `${slugify(row.player_name)}-${year}`,
          label: row.player_name,
          year,
          subtitle: fromClub,
          description: `${row.position || "Player"} signed from ${fromClub}`,
          popularity: getPopularity(club, row),
          tags: [row.position, row.window].filter(Boolean),
          source: "eordo/transfermarkt-data"
        };
      })
  ).sort((a, b) => a.year - b.year || a.label.localeCompare(b.label));

  return {
    id: meta.slug,
    slug: meta.slug,
    title: meta.title,
    shortTitle: meta.shortTitle,
    description: `Place ${meta.clubName} signings in the correct chronological order.`,
    category: "Football",
    sitePath: `/timeline/${meta.slug}`,
    theme: {
      primary: meta.primary,
      secondary: meta.secondary,
      background: meta.background,
      text: meta.text || meta.secondary
    },
    share: {
      title: meta.title,
      description: `How far can you build the ${meta.clubName} signing timeline?`,
      hashtags: [meta.shortTitle.replace(/\s+/g, ""), "FootballQuiz", "TimelineQuiz"]
    },
    seo: {
      title: `${meta.title} Quiz - ${meta.clubName} Signings Game`,
      description: `Play a ${meta.clubName} timeline quiz. Guess whether famous ${meta.clubName} players signed before or after each other and build the longest streak you can.`,
      keywords: [`${meta.clubName} quiz`, `${meta.clubName} signings`, "football timeline game", "Premier League quiz"]
    },
    items
  };
}

async function main() {
  const rowsByClub = new Map();
  const currentSeasonClubs = new Set();

  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    const response = await fetch(`${BASE_URL}/${year}.csv`);
    if (!response.ok) throw new Error(`Could not fetch ${year}.csv: ${response.status}`);
    const rows = parseCsv(await response.text());

    for (const row of rows) {
      if (!row.club) continue;
      if (year === END_YEAR) currentSeasonClubs.add(row.club);
      if (!rowsByClub.has(row.club)) rowsByClub.set(row.club, []);
      rowsByClub.get(row.club).push(row);
    }
  }

  const clubs = [...currentSeasonClubs].sort((a, b) => a.localeCompare(b));
  const written = [];
  const skipped = [];

  for (const club of clubs) {
    const meta = CLUBS[club];
    if (!meta) {
      skipped.push(`${club} (missing theme metadata)`);
      continue;
    }
    if (SKIP_SLUGS.has(meta.slug)) {
      skipped.push(`${club} (kept existing ${meta.slug}.json)`);
      continue;
    }

    const game = makeGame(club, rowsByClub.get(club) || []);
    const outPath = path.join(OUTPUT_DIR, `${game.slug}.json`);
    fs.writeFileSync(outPath, `${JSON.stringify(game, null, 2)}\n`, "utf8");
    written.push(`${game.slug}: ${game.items.length}`);
  }

  console.log(`Written ${written.length} files`);
  for (const line of written) console.log(`- ${line}`);
  if (skipped.length) {
    console.log("Skipped:");
    for (const line of skipped) console.log(`- ${line}`);
  }

  const generatedFiles = fs
    .readdirSync(OUTPUT_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort();
  const validation = generatedFiles.map((file) => {
    const game = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, file), "utf8").replace(/^\uFEFF/, ""));
    const badSubtitles = game.items.filter((item) => /U18|U21|U23|Without Club|^Unknown$/i.test(item.subtitle || "")).length;
    const yearsByLabel = new Map();

    for (const item of game.items) {
      const key = item.label.toLocaleLowerCase("en-US");
      if (!yearsByLabel.has(key)) yearsByLabel.set(key, new Set());
      yearsByLabel.get(key).add(item.year);
    }

    const duplicateMultiYearLabels = [...yearsByLabel.values()].filter((years) => years.size > 1).length;
    return `${game.slug}: items=${game.items.length}, badSubtitles=${badSubtitles}, duplicateMultiYearLabels=${duplicateMultiYearLabels}`;
  });

  console.log("Validation:");
  for (const line of validation) console.log(`- ${line}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
