import { useCallback, useEffect, useRef, useState } from "react";
import { getEmojiData } from "./data";
import type { EmojiGridApi } from "./createEmojiGrid";

interface UseEmojiPickerProps {
  onEmojiSelect: (shortcode: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  gridApiRef: React.RefObject<EmojiGridApi | null>;
}

export default function useEmojiPicker({
  onEmojiSelect,
  containerRef,
  gridApiRef,
}: UseEmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const timeOutsRef = useRef<number[]>([]);

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

  const renderFiltered = useCallback((emojis: string[]) => {
    const api = gridApiRef.current;
    if (!containerRef.current || !api) return;

    timeOutsRef.current.forEach((id) => clearTimeout(id));
    api.reset();

    if (emojis.length > 0) {
      api.addCategory(`Search Results (${emojis.length})`, "search", emojis);
    } else {
      api.showEmpty("No emojis found");
    }
  }, []);

  const renderContent = useCallback(() => {
    const api = gridApiRef.current;
    if (!containerRef.current || !api) return;

    timeOutsRef.current.forEach((id) => clearTimeout(id));
    api.reset();

    if (recentEmojis.length > 0) {
      api.addCategory("Recently Used", "recent", recentEmojis);
    }

    const emojiData = getEmojiData();
    emojiData?.categories.forEach((category, i) => {
      const name = category.id.replace("-", " & ");

      timeOutsRef.current.push(
        setTimeout(() => {
          api.addCategory(name, category.id, category.emojis);
        }, i * 500),
      );
    });
  }, [recentEmojis]);

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    renderContent();
  }, [renderContent]);

  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem("recentEmojis") || "[]",
    ) as string[];

    setRecentEmojis(saved);
  }, []);

  useEffect(() => {
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
    renderContent,
    renderFiltered,
  };
}
