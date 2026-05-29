export const siteConfig = {
  name: "Eras Games",
  url: "https://erasgames.com",
  description: "Free online timeline quiz games. Put football transfers, movie releases, and TV shows in the right chronological order.",
  defaultOgImage: "/opengraph-image"
};

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}
