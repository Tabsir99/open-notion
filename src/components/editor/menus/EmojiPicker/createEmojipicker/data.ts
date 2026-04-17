export interface EmojiSkin {
  unified: string;
  native: string;
  tone?: number | number[];
}

export interface Emoji {
  id: string;
  name: string;
  unicode: string;
  tags: string[];
  skins: EmojiSkin[];
  group: number;
  shortcodes: string[];
}

export interface EmojiCategory {
  id: string;
  icon: string;
  emojis: string[];
}

export interface EmojiData {
  emojis: Record<string, Emoji>;
  categories: EmojiCategory[];
}

// --- Singleton loader ---

let _cache: EmojiData | null = null;
let _emojiArray: Emoji[] | null = null;
let _inflight: Promise<EmojiData> | null = null;

/**
 * Configurable URL — point this to wherever emoji.json is served.
 * Defaults to /emoji.json (public folder in Next.js / Vite).
 */

export async function loadEmojiData(url: string): Promise<EmojiData> {
  if (_cache) return _cache;
  if (!_inflight) {
    _inflight = fetch(url)
      .then((r) => r.json())
      .then((data) => {
        _cache = data;
        _emojiArray = Object.values(data.emojis);
        return data;
      })
      .catch((err) => {
        _inflight = null;
        throw err;
      });
  }

  return _inflight;
}

/** Synchronous access — only valid after loadEmojiData() has resolved */
export function getEmojiData(): EmojiData | null {
  return _cache;
}

export function getEmojiArray(): Emoji[] {
  return _emojiArray ? _emojiArray : [];
}
