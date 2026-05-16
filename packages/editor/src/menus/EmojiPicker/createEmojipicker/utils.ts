import { getEmojiData } from "./data";
import { rankFuzzy } from "../../../lib/fuzzy";

const MAX_RESULTS = 200;

export const getRankedEmojiIds = (query: string): string[] => {
  const data = getEmojiData();
  if (!data) return [];
  const ids = Object.keys(data.emojis);
  const ranked = rankFuzzy(
    ids,
    query,
    (id) => {
      const e = data.emojis[id]!;
      return { high: e.shortcodes, medium: e.name, low: e.tags };
    },
    MAX_RESULTS,
  );
  return ranked;
};
