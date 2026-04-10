import { useCallback, useEffect, useRef, useState } from "react";
import { getEmojiArray, getEmojiData } from "./data";
import type { EmojiGridApi } from "./createEmojiGrid";

interface UseEmojiPickerProps {
  onEmojiSelect: (shortcode: string) => void;
  searchQuery: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  gridApiRef: React.RefObject<EmojiGridApi | null>;
}

export default function useEmojiPicker({
  onEmojiSelect,
  searchQuery,
  containerRef,
  gridApiRef,
}: UseEmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const timeOutsRef = useRef<number[]>([]);

  // ─── Derived / computed ────────────────────────────────────────────────────

  const getFilteredEmojis = useCallback(() => {
    if (!searchQuery.trim()) return null;

    const emojiArray = getEmojiArray();

    const query = searchQuery.toLowerCase();
    const filtered: string[] = [];

    for (let i = 0; i < emojiArray.length; i++) {
      const emoji = emojiArray[i];
      if (emoji.name.toLowerCase().includes(query)) {
        filtered.push(emoji.id);
      }
    }

    return filtered;
  }, [searchQuery]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const addRecentEmoji = useCallback((emojiId: string) => {
    setRecentEmojis((prev) => {
      const filtered = prev.filter((id) => id !== emojiId);
      const newRecent = [emojiId, ...filtered].slice(0, 18);
      localStorage.setItem("recentEmojis", JSON.stringify(newRecent));
      return newRecent;
    });
  }, []);

  // ─── DOM rendering ────────────────────────────────────────────────────────

  const renderContent = useCallback(() => {
    const api = gridApiRef.current;
    if (!containerRef.current || !api) return;

    timeOutsRef.current.forEach((id) => clearTimeout(id));

    api.reset();
    const filteredEmojis = getFilteredEmojis();

    if (filteredEmojis) {
      if (filteredEmojis.length > 0) {
        api.addCategory(
          `Search Results (${filteredEmojis.length})`,
          "search",
          filteredEmojis,
        );
      } else {
        api.showEmpty("No emojis found");
      }
      return;
    }

    if (recentEmojis.length > 0) {
      api.addCategory("Recently Used", "recent", recentEmojis);
    }

    const emojiData = getEmojiData();
    emojiData?.categories.forEach((category, i) => {
      const name = category.id.replace("-", " & ");

      timeOutsRef.current.push(
        setTimeout(() => {
          api.addCategory(name, category.id, category.emojis);
        }, i * 1000),
      );
    });
  }, [recentEmojis, getFilteredEmojis]);

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    renderContent();
  }, [renderContent]);

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("recentEmojis") || "[]",
    ) as string[];

    setRecentEmojis(saved);

    const handleClick = (e: PointerEvent) => {
      e.preventDefault();

      const target = e.target as Element;
      let img: HTMLImageElement;

      if (target.tagName === "BUTTON") {
        img = target.firstChild as HTMLImageElement;
      } else if (target.tagName === "IMG") {
        img = target as HTMLImageElement;
      } else {
        return;
      }

      addRecentEmoji(img.id);
      onEmojiSelect(getEmojiData()?.emojis[img.id].shortcodes[0] || "");
    };

    containerRef.current?.addEventListener("click", handleClick);

    return () => {
      containerRef.current?.removeEventListener("click", handleClick);
    };
  }, [onEmojiSelect]);

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    recentEmojis,
  };
}
