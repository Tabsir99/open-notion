import { getEmojiData } from "./data";

export const getFilteredEmojisByCategory = (
  query: string,
): { categoryId: string; ids: string[] }[] => {
  const data = getEmojiData();
  if (!data) return [];
  const q = query.toLowerCase();
  const result: { categoryId: string; ids: string[] }[] = [];

  for (const category of data.categories) {
    const matches: string[] = [];
    for (const id of category.emojis) {
      const emoji = data.emojis[id];
      if (emoji?.name.toLowerCase().includes(q)) matches.push(id);
    }
    if (matches.length > 0) {
      result.push({ categoryId: category.id, ids: matches });
    }
  }
  return result;
};
