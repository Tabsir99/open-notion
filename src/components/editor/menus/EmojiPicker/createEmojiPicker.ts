import { getEmojiData, getFilteredEmojisByCategory } from "./data";
import { getEmojiUrl } from "./getEmojiUrl";

export const COLUMN_COUNT = 10;
const STORAGE_KEY = "recentEmojis";
const MAX_RECENT = 18;

const FOCUSED_CLASS =
  "bg-accent outline outline-accent-foreground scroll-mt-10 scroll-mb-2.5".split(
    " ",
  );

const MOVES: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

// ─── Recents ───────────────────────────────────────────────────────────────

export function loadRecentEmojis(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentEmoji(id: string): string[] {
  const prev = loadRecentEmojis();
  const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

// ─── Factory ───────────────────────────────────────────────────────────────

export interface EmojiPickerOptions {
  onSelect: (shortcode: string) => void;
}

export type EmojiPickerApi = ReturnType<typeof createEmojiPicker>;

/**
 * Creates the entire emoji picker inside `root`. Builds two children:
 *   - .ep-scroll : the scrollable grid area
 *   - .ep-bar    : the category bar at the bottom
 * Owns all DOM, listeners, timers, state. React only provides the root div.
 */
export function createEmojiPicker(
  root: HTMLElement,
  options: EmojiPickerOptions,
) {
  // ─── Layout scaffold ─────────────────────────────────────────────────────

  root.className = "h-full flex flex-col relative";

  const scroll = document.createElement("div");
  scroll.className = "ep-scroll flex-1 overflow-auto min-h-0";
  scroll.style.scrollbarWidth = "none";
  (
    scroll.style as CSSStyleDeclaration & { msOverflowStyle?: string }
  ).msOverflowStyle = "none";
  root.appendChild(scroll);

  const bar = document.createElement("div");
  bar.className =
    "ep-bar shrink-0 border-t transition-all duration-200 overflow-hidden flex justify-between px-2 py-1";
  bar.addEventListener("pointerdown", (e) => e.preventDefault());
  root.appendChild(bar);

  // ─── State ───────────────────────────────────────────────────────────────

  const buttons: HTMLButtonElement[] = [];
  const grids: { start: number; count: number }[] = [];
  const timers: number[] = [];
  const categoryButtons = new Map<string, HTMLButtonElement>();
  let focusedIdx = -1;
  let desiredCol = 0;
  let activeCategory = "";

  // ─── Navigation ──────────────────────────────────────────────────────────

  const gridOf = (idx: number) =>
    grids.findIndex((g) => idx >= g.start && idx < g.start + g.count);

  const lastRowStart = (count: number) =>
    Math.floor((count - 1) / COLUMN_COUNT) * COLUMN_COUNT;

  const landAt = (gi: number, rowStart: number, col: number) => {
    const g = grids[gi];
    const rowLen = Math.min(COLUMN_COUNT, g.count - rowStart);
    return g.start + rowStart + Math.min(col, rowLen - 1);
  };

  const focusAt = (next: number) => {
    if (!buttons.length) return;
    const clamped = Math.max(0, Math.min(next, buttons.length - 1));
    if (clamped === focusedIdx) return;
    if (focusedIdx >= 0) buttons[focusedIdx].classList.remove(...FOCUSED_CLASS);
    buttons[clamped].classList.add(...FOCUSED_CLASS);
    buttons[clamped].scrollIntoView({ block: "nearest", behavior: "smooth" });
    focusedIdx = clamped;
  };

  const setFocus = (next: number) => {
    focusAt(next);
    const gi = gridOf(focusedIdx);
    if (gi >= 0) desiredCol = (focusedIdx - grids[gi].start) % COLUMN_COUNT;
  };

  const move = (dx: number, dy: number) => {
    if (focusedIdx < 0) return setFocus(0);
    const gi = gridOf(focusedIdx);
    if (gi < 0) return;
    const g = grids[gi];
    const local = focusedIdx - g.start;
    const rowStart = local - (local % COLUMN_COUNT);

    if (dx) {
      const next = focusedIdx + dx;
      if (next >= g.start && next < g.start + g.count) {
        focusAt(next);
        desiredCol = (next - g.start) % COLUMN_COUNT;
      } else if (dx > 0 && gi + 1 < grids.length) {
        focusAt(grids[gi + 1].start);
        desiredCol = 0;
      } else if (dx < 0 && gi > 0) {
        const pg = grids[gi - 1];
        focusAt(pg.start + pg.count - 1);
        desiredCol = (pg.count - 1) % COLUMN_COUNT;
      }
      return;
    }

    const targetRow = rowStart + dy * COLUMN_COUNT;
    if (targetRow >= 0 && targetRow < g.count) {
      focusAt(landAt(gi, targetRow, desiredCol));
    } else if (dy > 0 && gi + 1 < grids.length) {
      focusAt(landAt(gi + 1, 0, desiredCol));
    } else if (dy < 0 && gi > 0) {
      focusAt(landAt(gi - 1, lastRowStart(grids[gi - 1].count), desiredCol));
    } else {
      setFocus(dy > 0 ? buttons.length - 1 : 0);
    }
  };

  // ─── Scroll-spy ──────────────────────────────────────────────────────────

  const setActiveCategory = (key: string) => {
    if (key === activeCategory) return;
    categoryButtons.get(activeCategory)?.classList.remove("bg-gray-200");
    categoryButtons.get(key)?.classList.add("bg-gray-200");
    activeCategory = key;
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const top = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) {
        const key = top.target.id.replace("emoji-category-", "");
        setActiveCategory(key);
      }
    },
    { root: scroll, rootMargin: "0px 0px -80% 0px", threshold: 0 },
  );

  // ─── Grid DOM builders ───────────────────────────────────────────────────

  const addHeader = (title: string, key: string) => {
    const header = document.createElement("div");
    header.className =
      "font-semibold text-sm text-gray-700 p-2 pb-1 pl-3.5 sticky top-0 bg-background z-10 capitalize";
    header.id = `emoji-category-${key}`;
    header.textContent = title;
    scroll.appendChild(header);
    observer.observe(header);
  };

  const addGrid = (emojiIds: string[]) => {
    const data = getEmojiData();
    if (!data) return;

    const startIdx = buttons.length;
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = `repeat(${COLUMN_COUNT}, minmax(48px, 1fr))`;
    grid.style.padding = "8px";
    scroll.appendChild(grid);

    for (const id of emojiIds) {
      const emoji = data.emojis[id];
      if (!emoji) continue;

      const button = document.createElement("button");
      button.className =
        "w-12 h-12 border-none rounded-md cursor-pointer flex items-center justify-center transition-colors duration-200 p-2 hover:bg-[#f3f4f6] text-2xl";

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
      grid.appendChild(button);
      button.dataset.idx = buttons.length.toString();
      buttons.push(button);
    }

    const count = buttons.length - startIdx;
    if (count > 0) grids.push({ start: startIdx, count });
  };

  const addCategory = (title: string, key: string, ids: string[]) => {
    addHeader(title, key);
    addGrid(ids);
  };

  const showEmpty = (message: string) => {
    const el = document.createElement("div");
    el.style.cssText =
      "text-align:center;padding:40px 20px;color:#6b7280;font-size:14px;";
    el.textContent = message;
    scroll.appendChild(el);
  };

  const clear = () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
    observer.disconnect();
    scroll.innerHTML = "";
    buttons.length = 0;
    grids.length = 0;
    focusedIdx = -1;
    desiredCol = 0;
    activeCategory = "";
  };

  // ─── Category bar ────────────────────────────────────────────────────────

  const buildCategoryBar = () => {
    bar.innerHTML = "";
    categoryButtons.clear();
    const data = getEmojiData();
    if (!data) return;

    const entries: { id: string; icon: string }[] = [];
    if (loadRecentEmojis().length > 0) {
      entries.push({ id: "recent", icon: "231B" });
    }
    for (const c of data.categories) entries.push({ id: c.id, icon: c.icon });

    for (const { id, icon } of entries) {
      const btn = document.createElement("button");
      btn.className =
        "inline-flex items-center justify-center rounded-md transition-colors hover:bg-gray-100 size-9";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const el = document.getElementById(`emoji-category-${id}`);
        el?.scrollIntoView({ behavior: "smooth" });
      });

      const img = document.createElement("img");
      img.src = getEmojiUrl(icon, {
        provider: "noto-animated",
        format: "webp",
      });
      img.className = "size-6 select-none";
      img.draggable = false;
      btn.appendChild(img);

      bar.appendChild(btn);
      categoryButtons.set(id, btn);
    }
  };

  // ─── Public render ───────────────────────────────────────────────────────

  const renderAll = () => {
    clear();
    buildCategoryBar();
    bar.style.display = "";

    const recent = loadRecentEmojis();
    if (recent.length > 0) addCategory("Recently Used", "recent", recent);

    getEmojiData()?.categories.forEach((category, i) => {
      timers.push(
        window.setTimeout(() => {
          addCategory(
            category.id.replace("-", " & "),
            category.id,
            category.emojis,
          );
        }, i * 500),
      );
    });
  };

  const renderFiltered = (query: string) => {
    clear();
    bar.style.display = "none";

    const groups = getFilteredEmojisByCategory(query);
    if (groups.length === 0) {
      showEmpty("No emojis found");
      return;
    }
    for (const { categoryId, ids } of groups) {
      addCategory(categoryId.replace("-", " & "), `search-${categoryId}`, ids);
    }
  };

  // ─── Selection ───────────────────────────────────────────────────────────

  const selectById = (emojiId: string) => {
    const shortcode = getEmojiData()?.emojis[emojiId]?.shortcodes[0];
    if (!shortcode) return;
    saveRecentEmoji(emojiId);
    options.onSelect(shortcode);
  };

  const selectFocused = () => {
    if (focusedIdx < 0) return;
    const img = buttons[focusedIdx].querySelector("img");
    if (img?.id) selectById(img.id);
  };

  // ─── Listeners ───────────────────────────────────────────────────────────

  const handleMouseMove = (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn?.dataset.idx) return;
    setFocus(parseInt(btn.dataset.idx));
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

  // ─── Keys ────────────────────────────────────────────────────────────────

  const handleKey = (event: KeyboardEvent): boolean => {
    if (!buttons.length) return false;
    if (event.key === "Enter") {
      event.preventDefault();
      selectFocused();
      return true;
    }
    const delta = MOVES[event.key];
    if (!delta) return false;
    event.preventDefault();
    move(delta[0], delta[1]);
    return true;
  };

  // ─── Teardown ────────────────────────────────────────────────────────────

  const destroy = () => {
    clear();
    scroll.removeEventListener("mousemove", handleMouseMove);
    scroll.removeEventListener("pointerdown", handlePointerDown);
    observer.disconnect();
    root.innerHTML = "";
  };

  return { renderAll, renderFiltered, handleKey, selectFocused, destroy };
}
