// ─── ID convention (caller's responsibility) ───────────────────────────────
// Always pass `id` as UPPERCASE hex codepoints joined by "-":
//   single : "1F600"
//   multi  : "1F9D1-200D-1F91D-200D-1F9D1"
// Internal transforms (lowercase, underscore, etc.) are handled per-provider.
// ──────────────────────────────────────────────────────────────────────────

// prettier-ignore
export type EmojiOptions =
  // ── OpenMoji (default) ────────────────────────────────────────────────────
  // color/svg · black/svg · color/png@72 · color/png@618 · black/png@72 · black/png@618
  | { provider?: "openmoji"; style?: "color" | "black"; format?: "svg"                        }
  | { provider?: "openmoji"; style?: "color" | "black"; format:  "png"; size?: 72 | 618       }

  // ── Twemoji — jdecked fork (CC-BY 4.0) ───────────────────────────────────
  // svg · png@72x72
  | { provider: "twemoji";       format?: "svg" | "png"                                       }

  // ── Google Noto Emoji — static (Apache 2.0) ───────────────────────────────
  // svg · png@32 · png@72 · png@128 · png@512
  | { provider: "noto";          format?: "svg"                                                }
  | { provider: "noto";          format:  "png"; size?: 32 | 72 | 128 | 512                   }

  // ── Google Noto Emoji — animated (Apache 2.0) ─────────────────────────────
  // lottie (JSON) · gif@512 · webp@512
  | { provider: "noto-animated"; format?: "lottie" | "gif" | "webp"                           }

  // ── Microsoft Fluent Emoji (MIT) ─────────────────────────────────────────
  // 3d → PNG only  |  color / flat / high_contrast → SVG or PNG
  | { provider: "fluent"; style?: "color" | "flat" | "high_contrast"; format?: "svg" | "png" }
  | { provider: "fluent"; style:  "3d";                                format?: "png"         }

  // ── EmojiTwo — EmojiOne 2.x fork (CC-BY 4.0) ────────────────────────────
  // svg only
  | { provider: "emojitwo"                                                                     };

// ─── CDN bases ────────────────────────────────────────────────────────────
const CDN = {
  openmoji: "https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@latest",
  twemoji: "https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets",
  noto: "https://raw.githubusercontent.com/googlefonts/noto-emoji/main",
  notoAnimated: "https://fonts.gstatic.com/s/e/notoemoji/latest",
  fluent: "https://cdn.jsdelivr.net/gh/UXDivers/emojis@main/fluent",
  emojitwo: "https://cdn.jsdelivr.net/npm/emojitwo/svg",
} as const;

/**
 * Builds a CDN URL for an emoji from any of the supported open-source sets.
 *
 * @param id      - Uppercase hex codepoint(s) joined by "-" (ZWJ stripped).
 *                  e.g. "1F600" | "1F1E6-1F1F8" | "1F9D1-200D-1F91D-200D-1F9D1"
 * @param options - Provider, style, format, and (where applicable) size.
 *                  Defaults to OpenMoji color SVG when omitted entirely.
 *
 * @example
 * getEmojiUrl("1F600")
 * // → openmoji color svg (default)
 *
 * getEmojiUrl("1F600", { provider: "openmoji", style: "black", format: "png", size: 618 })
 * getEmojiUrl("1F600", { provider: "twemoji", format: "png" })
 * getEmojiUrl("1F600", { provider: "noto", format: "png", size: 512 })
 * getEmojiUrl("1F600", { provider: "noto-animated", format: "lottie" })
 * getEmojiUrl("1F600", { provider: "noto-animated", format: "gif" })
 * getEmojiUrl("1F600", { provider: "fluent", style: "3d" })
 * getEmojiUrl("1F600", { provider: "fluent", style: "flat", format: "svg" })
 * getEmojiUrl("1F600", { provider: "emojitwo" })
 */
export const getEmojiUrl = (id: string, options: EmojiOptions = {}): string => {
  const provider = (options as { provider?: string }).provider ?? "twemoji";

  // Pre-computed ID variants
  const lower = id.toLowerCase(); // twemoji / fluent / emojitwo
  const underscored = lower.replace(/-/g, "_"); // noto (emoji_u prefix) + noto-animated

  switch (provider) {
    case "openmoji": {
      const o = options as Extract<EmojiOptions, { provider?: "openmoji" }>;
      const style = o.style ?? "color";
      const format = o.format ?? "svg";
      if (format === "png") {
        const size = (o as Extract<typeof o, { format: "png" }>).size ?? 72;
        return `${CDN.openmoji}/${style}/png/${size}/${id}.png`;
      }
      return `${CDN.openmoji}/${style}/svg/${id}.svg`;
    }

    case "twemoji": {
      const { format = "svg" } = options as Extract<
        EmojiOptions,
        { provider: "twemoji" }
      >;
      // Twemoji PNG is exclusively 72×72; SVG is resolution-independent
      return format === "png"
        ? `${CDN.twemoji}/72x72/${lower}.png`
        : `${CDN.twemoji}/svg/${lower}.svg`;
    }

    case "noto": {
      const o = options as Extract<EmojiOptions, { provider: "noto" }>;
      if (o.format === "png") {
        const size = (o as Extract<typeof o, { format: "png" }>).size ?? 128;
        return `${CDN.noto}/png/${size}/emoji_u${underscored}.png`;
      }
      return `${CDN.noto}/svg/emoji_u${underscored}.svg`;
    }

    case "noto-animated": {
      const { format = "webp" } = options as Extract<
        EmojiOptions,
        { provider: "noto-animated" }
      >;
      // lottie → lottie.json  |  gif / webp → 512.gif / 512.webp
      const file = format === "lottie" ? "lottie.json" : `512.${format}`;
      return `${CDN.notoAnimated}/${underscored}/${file}`;
    }

    case "fluent": {
      const o = options as Extract<EmojiOptions, { provider: "fluent" }>;
      const style = o.style ?? "color";
      // 3d is PNG-only; all other styles default to SVG
      const format = o.format ?? (style === "3d" ? "png" : "svg");
      return `${CDN.fluent}/${style}/${lower}.${format}`;
    }

    case "emojitwo": {
      // EmojiTwo ships SVG only
      return `${CDN.emojitwo}/${lower}.svg`;
    }

    default: {
      throw new Error(`Unsupported emoji provider: ${provider}`);
    }
  }
};
