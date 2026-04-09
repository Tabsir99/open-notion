import { Button } from "@/components/ui/button";
import { useState } from "react";
import { getEmojiUrl, type EmojiData } from "./data";

export const EmojiCateogires = ({
  categories,
}: {
  categories: EmojiData["categories"];
}) => {
  const [activeCategory, setActiveCategory] = useState("smileys-emotion");

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
      {categories.map(({ id, icon }) => {
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
            <img src={getEmojiUrl(icon)} />
          </Button>
        );
      })}
    </div>
  );
};
