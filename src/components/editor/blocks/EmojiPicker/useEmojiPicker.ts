import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categories, emojis, emojiArray, rawCategories } from "./data";
import { getEmojiUrl } from "./getEmojiUrl";

const createGrid = (
  emojiIds: string[],
  container: HTMLElement,
  grid?: HTMLDivElement,
) => {
  const isNewGrid = !grid;

  if (isNewGrid) {
    grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = `repeat(auto-fit, minmax(48px, 1fr))`;
    grid.style.padding = "8px";
  }

  for (let i = 0; i < emojiIds.length; i++) {
    const id = emojiIds[i];
    const button = document.createElement("button");
    const className = `w-12 h-12 border-none rounded-md bg-transparent cursor-pointer
            flex items-center justify-center transition-colors duration-200
            p-1 hover:bg-[#f3f4f6] text-2xl`;

    const emoji = emojis[id];

    button.className = className;

    const img = document.createElement("img");
    img.src = getEmojiUrl(emoji.id);
    img.loading = "lazy";
    img.className = "block select-none";
    img.draggable = false;
    img.id = emoji.id;
    img.alt = emoji.unicode;
    img.title = emoji.name;

    img.onerror = () => {
      button.textContent = emoji.unicode;
      img.remove();
    };

    button.appendChild(img);
    grid!.appendChild(button);
  }

  if (isNewGrid) container.appendChild(grid!);
  return grid;
};

const createHeader = (title: string, key: string, container: HTMLElement) => {
  const header = document.createElement("div");

  header.className = `
  font-semibold text-sm text-gray-700
  p-2 pb-1 pl-3.5
`;

  header.id = `emoji-category-${key}`;

  header.textContent = title;
  container.appendChild(header);
  return header;
};

interface UseEmojiPickerProps {
  onEmojiSelect: (emojiId: string) => void;
}

export default function useEmojiPicker({ onEmojiSelect }: UseEmojiPickerProps) {
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeOutsRef = useRef<number[]>([]);

  // ─── Derived / computed ────────────────────────────────────────────────────

  const getFilteredEmojis = useCallback(() => {
    if (!searchQuery.trim()) return null;

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

  const emojiCategories = useMemo(() => {
    if (recentEmojis.length === 0) return categories;
    return [{ id: "recent", icon: "1F552" }, ...categories];
  }, [recentEmojis.length]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

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
    if (!containerRef.current) return;

    timeOutsRef.current.forEach((id) => clearTimeout(id));

    const container = containerRef.current;
    container.innerHTML = "";

    const filteredEmojis = getFilteredEmojis();

    if (filteredEmojis) {
      if (filteredEmojis.length > 0) {
        createHeader(
          `Search Results (${filteredEmojis.length})`,
          "search",
          container,
        );
        createGrid(filteredEmojis, container);
      } else {
        const noResults = document.createElement("div");
        noResults.style.cssText = `
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
          font-size: 14px;
        `;
        noResults.textContent = "No emojis found";
        container.appendChild(noResults);
      }
      return;
    }

    if (recentEmojis.length > 0) {
      createHeader("Recently Used", "recent", container);
      createGrid(recentEmojis, container);
    }

    rawCategories.forEach((category, i) => {
      const name = category.id.replace("-", " ");

      timeOutsRef.current.push(
        setTimeout(() => {
          createHeader(name, category.id, container);
          createGrid(category.emojis, container);
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
      onEmojiSelect(img.id);
    };

    containerRef.current?.addEventListener("click", handleClick);

    return () => {
      containerRef.current?.removeEventListener("click", handleClick);
    };
  }, [onEmojiSelect]);

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    searchQuery,
    containerRef,
    categories: emojiCategories,
    setSearchQuery,
    clearSearch,
  };
}
