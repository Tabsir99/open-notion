import emojiData from "./emoji.json";

export interface EmojiSkin {
  unified: string;
  native: string;
  tone?: number | number[];
}

export interface Emoji {
  id: string;
  name: string;
  unicode: string;
  keywords: string[];
  skins: EmojiSkin[];
  group: number;
}

export interface RawEmojiCategory {
  id: string;
  emojis: string[];
}

export interface EmojiData {
  emojis: Record<string, Emoji>;
  categories: typeof categories;
}

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

export const emojiArray = Object.values(emojiData.emojis);
export { emojiData };

export const getEmojiUrl = (id: string) => {
  return `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@latest/color/svg/${id}.svg`;
};
