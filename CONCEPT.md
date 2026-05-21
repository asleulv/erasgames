# Eras Games Concept

Eras Games is a platform for timeline-based quiz games. Each game uses the same core mechanic: the player is shown one known item with a year, then gets a new unknown item and must decide whether it belongs before or after the known year. Correct answers extend the timeline. One mistake ends the run.

The first game is `Wolves Timeline`, built from Wolverhampton Wanderers signing data. The same engine should later support many other datasets: football clubs, music charts, movies, history, sports events, culture, politics, or any topic where items can be placed on a timeline.

## Core Idea

Each game is defined by structured data, not custom code.

```json
{
  "id": "wolves",
  "slug": "wolves",
  "title": "Wolves Timeline",
  "description": "Place Wolverhampton Wanderers signings in the correct chronological order.",
  "items": [
    {
      "id": "ruben-neves-2017",
      "label": "Ruben Neves",
      "subtitle": "FC Porto",
      "year": 2017,
      "popularity": 100
    }
  ]
}
```

The app reads this data and generates:

- the playable timeline game
- the public game page
- SEO metadata
- OpenGraph/Twitter metadata
- sitemap entries
- share text
- themed visuals

## Game Rules

1. Start with one known item on the timeline.
2. Show a new active item without its year.
3. Ask whether it belongs before or after the visible year.
4. If correct, reveal the year and insert the item into the timeline.
5. If wrong, end the run and show results.

The engine must avoid ambiguous data. For example, a footballer who signed for the same club in two different years should not appear in the playable deck unless the game explicitly supports repeat signings.

## Platform Principles

- One reusable timeline engine.
- One fixed data format per game.
- One reusable game UI.
- Game-specific theming through config.
- SEO and sharing generated from the same game config.
- Mobile-first interaction.
- No custom one-off game pages unless the game truly needs different rules.

## SEO And Sharing

SEO and social sharing are part of the foundation, not an afterthought.

Every game should provide:

- `seo.title`
- `seo.description`
- `seo.keywords`
- `share.title`
- `share.description`
- `theme.primary`
- `theme.secondary`
- a canonical URL
- a generated OpenGraph image

Each game route should be statically generated where possible:

```text
/timeline/wolves
/timeline/arsenal
/timeline/hit-songs
```

For crawlers and link previews, each route should include:

- server-rendered title and description
- OpenGraph tags
- Twitter card tags
- JSON-LD structured data
- sitemap entry
- canonical URL

## Data Requirements

Each timeline item needs at minimum:

```ts
{
  id: string;
  label: string;
  year: number;
}
```

Recommended fields:

```ts
{
  subtitle?: string;
  description?: string;
  popularity?: number;
  tags?: string[];
  source?: string;
}
```

`popularity` helps the engine choose recognizable items, especially early in a run. The first rounds should feel approachable, then become harder as the timeline grows.

## Current Status

The current foundation in this repo includes:

- Next.js app structure
- reusable `TimelineGame` component
- shared timeline data types
- shared game registry
- Wolves game data
- `/timeline/[game]` route
- sitemap and robots routes
- base OpenGraph support
- local best score
- result sharing

The old `footballines` HTML prototype should be treated as a design and mechanics reference only. The real platform lives here.

## Near-Term Next Steps

1. Finish hardening OpenGraph image generation.
2. Add result modal polish and persistent stats.
3. Add daily seeded mode.
4. Add “how to play” modal.
5. Add more games using the same data format.
6. Add leaderboard/API only after the core game and sharing loop feel right.
