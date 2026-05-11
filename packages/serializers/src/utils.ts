export const CDN = {
  twemoji: "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets",
  notoAnimated: "https://fonts.gstatic.com/s/e/notoemoji/latest",
} as const;

export const getEmojiUrl = (
  hexId: string | null | undefined,
  source: "inline" | "callout-icon",
): string => {
  if (!hexId) return "";
  const lower = hexId.toLowerCase();
  const underscored = lower.replace(/-/g, "_");

  switch (source) {
    case "inline":
      return `${CDN.twemoji}/svg/${lower}.svg`;

    case "callout-icon":
      return `${CDN.notoAnimated}/${underscored}/512.webp`;
  }
};

