import { getEmojiData } from "./data";
import { createCategoryBar } from "./category";
import { createEmojiGrid } from "./dom";
import { createNavigator } from "./navigation";
import { getFilteredEmojisByCategory } from "./utils";

const STORAGE_KEY = "recentEmojis";
const MAX_RECENT = 18;

export interface EmojiPickerOptions {
  onSelect: (shortcode: string) => void;
}

export type EmojiPickerApi = ReturnType<typeof createEmojiPicker>;

const createScaffold = () => {
  const scroll = document.createElement("div");
  scroll.className = "ep-scroll flex-1 overflow-auto min-h-0";
  scroll.style.scrollbarWidth = "none";
  (
    scroll.style as CSSStyleDeclaration & { msOverflowStyle?: string }
  ).msOverflowStyle = "none";

  const bar = document.createElement("div");
  bar.className =
    "ep-bar shrink-0 border-t transition-all duration-200 overflow-hidden flex justify-between px-2 py-1";

  return { scroll, bar };
};

export function createEmojiPicker(
  root: HTMLElement,
  options: EmojiPickerOptions,
) {
  const emojiData = getEmojiData();
  if (!emojiData) throw new Error("Emoji data not found");

  let recent: string[] =
    typeof localStorage !== "undefined"
      ? JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
      : [];

  // Layout scaffold
  const { bar, scroll } = createScaffold();

  root.className = "h-full flex flex-col relative";
  root.appendChild(scroll);
  root.appendChild(bar);

  // Instantiate factories

  const area = createEmojiGrid(scroll);
  const nav = createNavigator(area.buttons, area.grids);
  const categoryBar = createCategoryBar(bar, scroll, (key) => {
    const gridIdx = area.getGridIdxForKey(key);
    nav.setFocusToGrid(gridIdx);
  });

  const selectById = (id: string) => {
    const shortcode = emojiData.emojis[id]?.shortcodes[0];
    if (!shortcode) return;
    recent = [id, ...recent.filter((x) => x !== id)].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    options.onSelect(shortcode);
  };

  const selectFocused = () => {
    const idx = nav.getFocusedIdx();
    if (idx < 0) return;
    const img = area.buttons[idx].querySelector("img");
    if (img?.id) selectById(img.id);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn?.dataset.idx) return;
    nav.setFocus(parseInt(btn.dataset.idx));
  };

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const img =
      target.tagName === "IMG"
        ? (target as HTMLImageElement)
        : (target.closest("button")?.querySelector("img") ?? null);
    if (img?.id && img.closest(".ep-scroll")) selectById(img.id);
  };

  scroll.addEventListener("mousemove", handleMouseMove, { passive: true });
  scroll.addEventListener("pointerdown", handlePointerDown);

  // Public render methods
  const renderAll = () => {
    area.clear();
    nav.reset();
    categoryBar.build(recent.length > 0);
    bar.style.display = "";

    if (recent.length > 0) area.addCategory("Recently Used", "recent", recent);

    emojiData.categories.forEach((category, i) => {
      area.timers.push(
        window.setTimeout(() => {
          area.addCategory(
            category.id.replace("-", " & "),
            category.id,
            category.emojis,
          );
        }, i * 500),
      );
    });
  };

  const renderFiltered = (query: string) => {
    area.clear();
    nav.reset();
    bar.style.display = "none";

    const groups = getFilteredEmojisByCategory(query);
    if (groups.length === 0) {
      area.showEmpty("No emojis found");
      return;
    }
    for (const { categoryId, ids } of groups) {
      area.addCategory(
        categoryId.replace("-", " & "),
        `search-${categoryId}`,
        ids,
      );
    }
  };

  const handleKey = (event: KeyboardEvent) =>
    nav.handleKey(event, selectFocused);

  const destroy = () => {
    area.destroy();
    scroll.removeEventListener("mousemove", handleMouseMove);
    scroll.removeEventListener("pointerdown", handlePointerDown);
    root.innerHTML = "";
  };

  return { renderAll, renderFiltered, handleKey, selectFocused, destroy };
}
