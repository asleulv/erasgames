export const siteConfig = {
  name: "Eras Games",
  url: "https://erasgames.com",
  description: "Timeline quiz games built around football, music, history, and pop culture.",
  defaultOgImage: "/opengraph-image"
};

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}
