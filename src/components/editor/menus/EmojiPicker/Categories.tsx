import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { getEmojiData, type EmojiCategory } from "./data";
import { getEmojiUrl } from "./getEmojiUrl";
import { loadRecentEmojis } from "./createEmojiPicker";

export const EmojiCategories = () => {
  const [activeCategory, setActiveCategory] = useState("smileys-emotion");

  const emojiCategories: EmojiCategory[] = useMemo(() => {
    const emojiData = getEmojiData();
    if (!emojiData) return [];

    const hasRecent = loadRecentEmojis().length > 0;
    if (!hasRecent) return emojiData.categories;
    return [
      { id: "recent", icon: "231B", emojis: [] },
      ...emojiData.categories,
    ];
  }, []);

  const handleCategorySelect = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    setActiveCategory(key);
    const el = document.getElementById(`emoji-category-${key}`);

    if (!el) return;
    el.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div
      onPointerDown={(e) => e.preventDefault()}
      className={`shrink-0 border-t transition-all duration-200 overflow-hidden flex justify-between px-2 py-1`}
    >
      {emojiCategories.map(({ id, icon }) => {
        return (
          <Button
            key={id}
            variant="ghost"
            className={`rounded-md transition-colors ${
              activeCategory === id && "bg-gray-200"
            }`}
            size="icon"
            onClick={(e) => handleCategorySelect(e, id)}
          >
            <img
              src={getEmojiUrl(icon, {
                provider: "noto-animated",
                format: "webp",
              })}
            />
          </Button>
        );
      })}
    </div>
  );
};
