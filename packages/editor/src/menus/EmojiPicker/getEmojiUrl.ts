// Always pass `id` as UPPERCASE hex codepoints joined by "-":
//   single : "1F600"
//   multi  : "1F9D1-200D-1F91D-200D-1F9D1"
// Internal transforms (lowercase, underscore, etc.) are handled per-provider.

import type { GetEmojiUrl } from "../../config";

const CDN = {
  openmoji: "https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@latest",
  twemoji: "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets",
  noto: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main",
  notoAnimated: "https://fonts.gstatic.com/s/e/notoemoji/latest",
  fluent: "https://cdn.jsdelivr.net/gh/UXDivers/emojis@main/fluent",
  emojitwo: "https://cdn.jsdelivr.net/npm/emojitwo/svg",
} as const;

export const getEmojiUrl: GetEmojiUrl = (hexId, source): string => {
  const lower = hexId.toLowerCase();
  const underscored = lower.replace(/-/g, "_");

  switch (source) {
    case "inline":
      return `${CDN.twemoji}/svg/${lower}.svg`;

    case "picker-grid":
      return `${CDN.twemoji}/72x72/${lower}.png`;

    case "category-bar":
    case "callout-icon":
      return `${CDN.notoAnimated}/${underscored}/512.webp`;
  }
};
