const fs = require("fs");
const path = require("path");

const START_SEASON = 1992;
const END_SEASON = 2025;
const BASE_URL = "https://www.transfermarkt.us";
const OUTPUT_DIR = path.join("data", "games");

const CLUBS = [
  {
    slug: "bournemouth",
    shortTitle: "Bournemouth",
    clubName: "AFC Bournemouth",
    tmPath: "/afc-bournemouth/alletransfers/verein/989",
    primary: "#DA291C",
    secondary: "#000000",
    background: "#FFF4F2"
  },
  {
    slug: "arsenal",
    shortTitle: "Arsenal",
    clubName: "Arsenal",
    tmPath: "/fc-arsenal/alletransfers/verein/11",
    primary: "#EF0107",
    secondary: "#063672",
    background: "#FFF5F2"
  },
  {
    slug: "aston-villa",
    shortTitle: "Aston Villa",
    clubName: "Aston Villa",
    tmPath: "/aston-villa/alletransfers/verein/405",
    primary: "#95BFE5",
    secondary: "#670E36",
    background: "#F2F8FC"
  },
  {
    slug: "brentford",
    shortTitle: "Brentford",
    clubName: "Brentford",
    tmPath: "/fc-brentford/alletransfers/verein/1148",
    primary: "#E30613",
    secondary: "#111111",
    background: "#FFF4F4"
  },
  {
    slug: "brighton",
    shortTitle: "Brighton",
    clubName: "Brighton & Hove Albion",
    tmPath: "/brighton-amp-hove-albion/alletransfers/verein/1237",
    primary: "#0057B8",
    secondary: "#FFFFFF",
    background: "#F1F7FF",
    text: "#101820"
  },
  {
    slug: "burnley",
    shortTitle: "Burnley",
    clubName: "Burnley",
    tmPath: "/fc-burnley/alletransfers/verein/1132",
    primary: "#6C1D45",
    secondary: "#99D6EA",
    background: "#FFF3F8",
    text: "#24111B"
  },
  {
    slug: "chelsea",
    shortTitle: "Chelsea",
    clubName: "Chelsea",
    tmPath: "/fc-chelsea/alletransfers/verein/631",
    primary: "#034694",
    secondary: "#DBA111",
    background: "#F1F6FF"
  },
  {
    slug: "crystal-palace",
    shortTitle: "Crystal Palace",
    clubName: "Crystal Palace",
    tmPath: "/crystal-palace/alletransfers/verein/873",
    primary: "#1B458F",
    secondary: "#C4122E",
    background: "#F2F6FF"
  },
  {
    slug: "everton",
    shortTitle: "Everton",
    clubName: "Everton",
    tmPath: "/fc-everton/alletransfers/verein/29",
    primary: "#003399",
    secondary: "#FFFFFF",
    background: "#F1F5FF",
    text: "#101820"
  },
  {
    slug: "fulham",
    shortTitle: "Fulham",
    clubName: "Fulham",
    tmPath: "/fc-fulham/alletransfers/verein/931",
    primary: "#FFFFFF",
    secondary: "#CC0000",
    background: "#F8F8F8",
    text: "#101820"
  },
  {
    slug: "leeds",
    shortTitle: "Leeds",
    clubName: "Leeds United",
    tmPath: "/leeds-united/alletransfers/verein/399",
    primary: "#FFCD00",
    secondary: "#1D428A",
    background: "#FFFBEA"
  },
  {
    slug: "liverpool",
    shortTitle: "Liverpool",
    clubName: "Liverpool",
    tmPath: "/fc-liverpool/alletransfers/verein/31",
    primary: "#C8102E",
    secondary: "#00B2A9",
    background: "#FFF3F5",
    text: "#101820"
  },
  {
    slug: "man-city",
    shortTitle: "Man City",
    clubName: "Manchester City",
    tmPath: "/manchester-city/alletransfers/verein/281",
    primary: "#6CABDD",
    secondary: "#1C2C5B",
    background: "#F1F9FF"
  },
  {
    slug: "man-united",
    shortTitle: "Man United",
    clubName: "Manchester United",
    tmPath: "/manchester-united/alletransfers/verein/985",
    primary: "#DA291C",
    secondary: "#FBE122",
    background: "#FFF4F2",
    text: "#111111"
  },
  {
    slug: "newcastle",
    shortTitle: "Newcastle",
    clubName: "Newcastle United",
    tmPath: "/newcastle-united/alletransfers/verein/762",
    primary: "#241F20",
    secondary: "#FFFFFF",
    background: "#F4F4F4",
    text: "#111111"
  },
  {
    slug: "nottingham-forest",
    shortTitle: "Forest",
    clubName: "Nottingham Forest",
    tmPath: "/nottingham-forest/alletransfers/verein/703",
    primary: "#DD0000",
    secondary: "#FFFFFF",
    background: "#FFF4F4",
    text: "#111111"
  },
  {
    slug: "sunderland",
    shortTitle: "Sunderland",
    clubName: "Sunderland",
    tmPath: "/afc-sunderland/alletransfers/verein/289",
    primary: "#EB172B",
    secondary: "#111111",
    background: "#FFF4F5"
  },
  {
    slug: "tottenham",
    shortTitle: "Tottenham",
    clubName: "Tottenham Hotspur",
    tmPath: "/tottenham-hotspur/alletransfers/verein/148",
    primary: "#132257",
    secondary: "#FFFFFF",
    background: "#F5F7FF",
    text: "#101820"
  },
  {
    slug: "west-ham",
    shortTitle: "West Ham",
    clubName: "West Ham United",
    tmPath: "/west-ham-united/alletransfers/verein/379",
    primary: "#7A263A",
    secondary: "#1BB1E7",
    background: "#FFF3F6"
  }
];

const MANUAL_BOOSTS = {
  arsenal: {
    "Dennis Bergkamp": 100,
    "Patrick Vieira": 100,
    "Thierry Henry": 100,
    "Sol Campbell": 100,
    "Robert Pires": 95,
    "Cesc Fabregas": 100,
    "Robin van Persie": 100,
    "Mesut Ozil": 100,
    "Alexis Sanchez": 100,
    "Pierre-Emerick Aubameyang": 100,
    "Martin Odegaard": 100,
    "Declan Rice": 100
  },
  brentford: {
    "Ivan Toney": 100,
    "Bryan Mbeumo": 100,
    "Christian Norgaard": 95,
    "Ollie Watkins": 100,
    "Neal Maupay": 90,
    "Said Benrahma": 95
  },
  chelsea: {
    "Didier Drogba": 100,
    "Eden Hazard": 100,
    "Frank Lampard": 100,
    "Claude Makelele": 95,
    "N'Golo Kante": 100,
    "Fernando Torres": 95
  },
  liverpool: {
    "Mohamed Salah": 100,
    "Sadio Mane": 100,
    "Virgil van Dijk": 100,
    "Alisson": 95,
    "Luis Suarez": 100,
    "Fernando Torres": 100
  },
  "man-city": {
    "Sergio Aguero": 100,
    "David Silva": 100,
    "Yaya Toure": 100,
    "Kevin De Bruyne": 100,
    "Erling Haaland": 100
  },
  "man-united": {
    "Eric Cantona": 100,
    "Cristiano Ronaldo": 100,
    "Wayne Rooney": 100,
    "Rio Ferdinand": 95,
    "Robin van Persie": 100,
    "Bruno Fernandes": 95
  },
  tottenham: {
    "Gareth Bale": 100,
    "Luka Modric": 100,
    "Son Heung-min": 100,
    "Rafael van der Vaart": 95,
    "Dimitar Berbatov": 95
  }
};

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ouml;/g, "ö")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&aacute;/g, "á")
    .replace(/&Aacute;/g, "Á")
    .replace(/&eacute;/g, "é")
    .replace(/&Eacute;/g, "É")
    .replace(/&iacute;/g, "í")
    .replace(/&Iacute;/g, "Í")
    .replace(/&oacute;/g, "ó")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&uacute;/g, "ú")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&ntilde;/g, "ñ")
    .replace(/&ccedil;/g, "ç")
    .replace(/&rsquo;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/<[^>]*>/g, "")
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

function seasonStart(label) {
  const match = label.match(/(\d{2})\/(\d{2})/);
  if (!match) return null;
  const first = Number(match[1]);
  return first >= 80 ? 1900 + first : 2000 + first;
}

function feeValue(fee) {
  const clean = decodeHtml(fee).replace(/,/g, ".");
  const match = clean.match(/€\s*([\d.]+)\s*([mk])?/i);
  if (!match) return 0;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return 0;
  if ((match[2] || "").toLowerCase() === "m") return value * 1000000;
  if ((match[2] || "").toLowerCase() === "k") return value * 1000;
  return value;
}

function popularity(club, item) {
  const money = feeValue(item.fee);
  let score = 45;
  if (money >= 100000000) score = 100;
  else if (money >= 60000000) score = 95;
  else if (money >= 40000000) score = 88;
  else if (money >= 20000000) score = 78;
  else if (money >= 10000000) score = 65;
  else if (money >= 3000000) score = 55;

  const plainName = stripAccents(item.label);
  return Math.max(score, MANUAL_BOOSTS[club.slug]?.[plainName] || MANUAL_BOOSTS[club.slug]?.[item.label] || 0);
}

function isBadSourceClub(club, sourceClub) {
  const source = decodeHtml(sourceClub);
  if (!source || /^Unknown$/i.test(source) || /Without Club|Career break|Retired/i.test(source)) return true;
  if (/\b(U17|U18|U19|U21|U23|Youth|Academy|Res\.|Reserves?)\b/i.test(source)) return true;
  if (/\bB$/i.test(source) && new RegExp(stripAccents(club.shortTitle), "i").test(stripAccents(source))) return true;
  return false;
}

function isPermanentFee(fee) {
  const clean = decodeHtml(fee);
  if (!clean) return false;
  if (/loan|end of loan/i.test(clean)) return false;
  return true;
}

function parseRows(block, year) {
  const rows = [...block.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((match) => match[1]);
  return rows
    .map((row) => {
      const player = row.match(/<td class="hauptlink">\s*<a title="([^"]+)" href="([^"]+)"/);
      const clubs = [...row.matchAll(/<td class="no-border-links">\s*<a title="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
      const fee = row.match(/<td class="rechts">([\s\S]*?)<\/td>/);

      if (!player || !clubs.length || !fee) return null;
      const label = decodeHtml(player[1]);
      const playerId = (player[2].match(/spieler\/(\d+)/) || [])[1] || slugify(label);
      const fromClub = decodeHtml(clubs[clubs.length - 1][1] || clubs[clubs.length - 1][2]);

      return {
        label,
        playerId,
        year,
        subtitle: fromClub,
        fee: decodeHtml(fee[1])
      };
    })
    .filter(Boolean);
}

function parseTransfermarkt(html) {
  const arrivals = [];
  const blockPattern =
    /<h2 class="content-box-headline">\s*Arrivals\s+(\d{2}\/\d{2})\s*<\/h2>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/g;
  for (const match of html.matchAll(blockPattern)) {
    const year = seasonStart(match[1]);
    if (!year || year < START_SEASON || year > END_SEASON) continue;
    arrivals.push(...parseRows(match[2], year));
  }
  return arrivals;
}

function removeDuplicateSignings(items) {
  const byLabel = new Map();
  for (const item of items) {
    const key = stripAccents(item.label).toLowerCase();
    if (!byLabel.has(key)) byLabel.set(key, new Set());
    byLabel.get(key).add(item.year);
  }

  return items.filter((item) => byLabel.get(stripAccents(item.label).toLowerCase()).size === 1);
}

function makeGame(club, rows) {
  const source = `${BASE_URL}${club.tmPath}`;
  const items = removeDuplicateSignings(
    rows
      .filter((row) => isPermanentFee(row.fee) && !isBadSourceClub(club, row.subtitle))
      .map((row) => ({
        id: `${slugify(row.label)}-${row.year}`,
        label: row.label,
        year: row.year,
        subtitle: row.subtitle,
        description: `Signed from ${row.subtitle}`,
        popularity: popularity(club, row),
        tags: [],
        source
      }))
  ).sort((a, b) => a.year - b.year || a.label.localeCompare(b.label));

  const title = `${club.shortTitle} Timeline`;
  return {
    id: club.slug,
    slug: club.slug,
    title,
    shortTitle: club.shortTitle,
    description: `Place ${club.clubName} signings in the correct chronological order.`,
    category: "Football",
    sitePath: `/timeline/${club.slug}`,
    theme: {
      primary: club.primary,
      secondary: club.secondary,
      background: club.background,
      text: club.text || club.secondary
    },
    share: {
      title,
      description: `How far can you build the ${club.clubName} signing timeline?`,
      hashtags: [club.shortTitle.replace(/\s+/g, ""), "FootballQuiz", "TimelineQuiz"]
    },
    seo: {
      title: `${title} Quiz - ${club.clubName} Signings Game`,
      description: `Play a ${club.clubName} timeline quiz. Guess whether famous ${club.clubName} players signed before or after each other and build the longest streak you can.`,
      keywords: [`${club.clubName} quiz`, `${club.clubName} signings`, "football timeline game", "Premier League quiz"]
    },
    items
  };
}

async function fetchClub(club) {
  const response = await fetch(`${BASE_URL}${club.tmPath}`, {
    headers: {
      "accept-language": "en-US,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
    }
  });

  if (!response.ok) throw new Error(`${club.slug}: Transfermarkt responded ${response.status}`);
  return response.text();
}

async function main() {
  const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
  const only = onlyArg ? new Set(onlyArg.replace("--only=", "").split(",").map((slug) => slug.trim())) : null;
  const skipExisting = new Set(
    (process.argv.find((arg) => arg.startsWith("--skip-existing=")) || "")
      .replace("--skip-existing=", "")
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean)
  );

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const club of CLUBS) {
    if (only && !only.has(club.slug)) continue;
    if (skipExisting.has(club.slug) && fs.existsSync(path.join(OUTPUT_DIR, `${club.slug}.json`))) {
      console.log(`Skipped ${club.slug}: keeping existing file`);
      continue;
    }

    const html = await fetchClub(club);
    const rows = parseTransfermarkt(html);
    const game = makeGame(club, rows);
    fs.writeFileSync(path.join(OUTPUT_DIR, `${club.slug}.json`), `${JSON.stringify(game, null, 2)}\n`, "utf8");
    const yearRange = game.items.length ? `${game.items[0].year}-${game.items[game.items.length - 1].year}` : "none";
    console.log(`${club.slug}: raw=${rows.length}, clean=${game.items.length}, years=${yearRange}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
