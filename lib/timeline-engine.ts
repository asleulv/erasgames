import type { TimelineItem } from "@/lib/timeline-types";

export function makeSeed(seedText: string): number {
  let seed = 2166136261;
  for (let index = 0; index < seedText.length; index += 1) {
    seed ^= seedText.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

export function createRng(initialSeed: number): () => number {
  let seed = initialSeed >>> 0;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function getPlayableItems(items: TimelineItem[]): TimelineItem[] {
  const yearsByLabel = items.reduce((groups, item) => {
    const key = item.label.toLocaleLowerCase("en-US");
    if (!groups.has(key)) groups.set(key, new Set<number>());
    groups.get(key)?.add(item.year);
    return groups;
  }, new Map<string, Set<number>>());

  return items.filter((item) => {
    const key = item.label.toLocaleLowerCase("en-US");
    return (yearsByLabel.get(key)?.size || 0) === 1;
  });
}

export function pickWeighted(items: TimelineItem[], random: () => number): TimelineItem {
  const total = items.reduce((sum, item) => sum + Math.max(item.popularity || 1, 1), 0);
  let roll = random() * total;
  for (const item of items) {
    roll -= Math.max(item.popularity || 1, 1);
    if (roll <= 0) return item;
  }
  return items[0];
}
