import emojiData from "@/assets/emoji.json";

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

export interface RawEmojiCategory {
  id: string;
  emojis: string[];
}

export interface EmojiData {
  emojis: Record<string, Emoji>;
  categories: typeof categories;
}

export const emojis = emojiData.emojis as Record<string, Emoji>;
export const emojiArray = Object.values(emojis);
export const rawCategories = emojiData.categories as RawEmojiCategory[];

export const categories: { id: string; icon: string }[] = Object.entries({
  "smileys-emotion": "1F604", // 😄
  "people-body": "1F64B", // 🙋
  "animals-nature": "1F431", // 🐱
  "food-drink": "1F34E", // 🍎
  "travel-places": "2708", // ✈️
  activities: "1F3C6", // 🏆
  objects: "1F527", // 🔧
  symbols: "1F531", // 🔱
  flags: "1F3C1", // 🏁
}).map(([key, value]) => ({ id: key, icon: value }));
