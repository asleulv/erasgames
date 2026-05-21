const fs = require("fs");
const path = require("path");

const START = 1992;
const END = 2025;
const BASE = "https://raw.githubusercontent.com/eordo/transfermarkt-data/master/premier_league";

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
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
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

function slugify(name, year) {
  return `${name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${year}`;
}

const manualBoost = new Map(
  Object.entries({
    "Dennis Bergkamp": 100,
    "Patrick Vieira": 100,
    "Thierry Henry": 100,
    "Sol Campbell": 100,
    "Robert Pires": 95,
    "Freddie Ljungberg": 95,
    "Gilberto Silva": 95,
    "Cesc Fàbregas": 100,
    "Robin van Persie": 100,
    "Theo Walcott": 95,
    "Mesut Özil": 100,
    "Alexis Sánchez": 100,
    "Pierre-Emerick Aubameyang": 100,
    "Gabriel Jesus": 95,
    "Martin Ødegaard": 100,
    "Declan Rice": 100,
    "Kai Havertz": 95,
    "Mikel Arteta": 95,
    "Aaron Ramsey": 95,
    "Santi Cazorla": 95,
    "Alexandre Lacazette": 95,
    "Granit Xhaka": 95,
    "Laurent Koscielny": 95,
    "Per Mertesacker": 88,
    "Andrey Arshavin": 95,
    "Emmanuel Adebayor": 88,
    "Kolo Touré": 88,
    "Bacary Sagna": 88,
    "Thomas Partey": 95,
    "Gabriel Magalhães": 95,
    "Ben White": 88,
    "Leandro Trossard": 88,
    "Jurrien Timber": 88,
    "Riccardo Calafiori": 88,
    "David Raya": 88,
    "Martin Zubimendi": 95,
    "Viktor Gyökeres": 95,
    "Eberechi Eze": 95,
    "Noni Madueke": 88
  })
);

function popularity(row) {
  const fee = Number(row.fee || 0) || 0;
  const marketValue = Number(row.market_value || 0) || 0;
  const money = Math.max(fee, marketValue);
  let score = 45;

  if (money >= 100000000) score = 100;
  else if (money >= 60000000) score = 95;
  else if (money >= 40000000) score = 88;
  else if (money >= 20000000) score = 75;

  return Math.max(score, manualBoost.get(row.player_name) || 0);
}

function signedYear(row) {
  return Number(row.window === "winter" ? Number(row.season) + 1 : row.season);
}

const excludedSourceClub =
  /Arsenal\s+(U18|U21|U23|Youth|Academy)|Arsenal FC U18|Arsenal FC U21|Arsenal FC U23|Without Club|^Unknown$/i;

async function main() {
  const transfers = [];

  for (let year = START; year <= END; year += 1) {
    const response = await fetch(`${BASE}/${year}.csv`);
    if (!response.ok) throw new Error(`Could not fetch ${year}.csv: ${response.status}`);

    const rows = parseCsv(await response.text());
    transfers.push(
      ...rows.filter((row) => {
        return (
          row.club === "Arsenal FC" &&
          row.movement === "in" &&
          String(row.is_loan) === "0" &&
          !excludedSourceClub.test(row.dealing_club || "")
        );
      })
    );
  }

  const items = transfers
    .map((row) => {
      const year = signedYear(row);
      const fromClub = row.dealing_club || "Unknown club";

      return {
        id: slugify(row.player_name, year),
        label: row.player_name,
        year,
        subtitle: fromClub,
        description: `${row.position || "Player"} signed from ${fromClub}`,
        popularity: popularity(row),
        tags: [row.position, row.window].filter(Boolean),
        source: "eordo/transfermarkt-data"
      };
    })
    .sort((a, b) => a.year - b.year || a.label.localeCompare(b.label));

  const game = {
    id: "arsenal",
    slug: "arsenal",
    title: "Arsenal Timeline",
    shortTitle: "Arsenal",
    description: "Place Arsenal signings in the correct chronological order.",
    category: "Football",
    sitePath: "/timeline/arsenal",
    theme: {
      primary: "#EF0107",
      secondary: "#063672",
      background: "#FFF5F2",
      text: "#101820"
    },
    share: {
      title: "Arsenal Timeline",
      description: "How far can you build the Arsenal signing timeline?",
      hashtags: ["Arsenal", "FootballQuiz", "TimelineQuiz"]
    },
    seo: {
      title: "Arsenal Timeline Quiz - Arsenal FC Signings Game",
      description:
        "Play an Arsenal timeline quiz. Guess whether famous Arsenal players signed before or after each other and build the longest streak you can.",
      keywords: ["Arsenal quiz", "Arsenal FC quiz", "football timeline game", "Premier League quiz", "Arsenal signings"]
    },
    items
  };

  fs.writeFileSync(path.join("data", "games", "arsenal.json"), `${JSON.stringify(game, null, 2)}\n`, "utf8");
  console.log(`Wrote data/games/arsenal.json with ${items.length} items`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
