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

let _cache: EmojiData | null = null;
let _emojiArray: Emoji[] | null = null;
let _inflight: Promise<EmojiData> | null = null;
const _listeners = new Set<() => void>();

const _setEmojiData = (data: EmojiData) => {
  _cache = data;
  _emojiArray = Object.values(data.emojis);
  for (const cb of _listeners) cb();
  _listeners.clear();
  return data;
};

/** Run `cb` once the emoji data is available. Fires immediately if already loaded. */
export function onEmojiDataLoaded(cb: () => void): () => void {
  if (_cache) {
    cb();
    return () => {};
  }
  _listeners.add(cb);
  return () => {
    _listeners.delete(cb);
  };
}
/**
 * Configurable URL — point this to wherever emoji.json is served.
 * Defaults to /emoji.json (public folder in Next.js / Vite).
 */

export async function loadEmojiData(loader: string | EmojiData) {
  if (!_inflight) {
    if (typeof loader !== "string") {
      _setEmojiData(loader);
      return;
    }

    _inflight = fetch(loader)
      .then((r) => r.json())
      .then(_setEmojiData)
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
