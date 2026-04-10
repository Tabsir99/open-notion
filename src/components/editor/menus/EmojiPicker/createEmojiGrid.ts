import { getEmojiData } from "./data";
import { getEmojiUrl } from "./getEmojiUrl";

export const COLUMN_COUNT = 10;
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

export type EmojiGridApi = ReturnType<typeof createEmojiGrid>;

export function createEmojiGrid(container: HTMLElement) {
  const buttons: HTMLButtonElement[] = [];
  const grids: { start: number; count: number }[] = [];
  let focusedIdx = -1;
  let desiredCol = 0;

  const handleMouseMove = (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest("button");
    if (!btn) return;
    const idx = btn.dataset.idx;
    if (typeof idx === "string") setFocus(parseInt(idx));
  };
  container.addEventListener("mousemove", handleMouseMove, { passive: true });

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
        const ng = grids[gi + 1];
        focusAt(ng.start);
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

  const addHeader = (title: string, key: string) => {
    const header = document.createElement("div");
    header.className =
      "font-semibold text-sm text-gray-700 p-2 pb-1 pl-3.5 sticky top-0 bg-background z-10 capitalize";
    header.id = `emoji-category-${key}`;
    header.textContent = title;
    container.appendChild(header);
  };

  const addGrid = (emojiIds: string[]) => {
    const data = getEmojiData();
    if (!data) return;

    const startIdx = buttons.length;
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = `repeat(${COLUMN_COUNT}, minmax(48px, 1fr))`;
    grid.style.padding = "8px";
    container.appendChild(grid);

    for (const id of emojiIds) {
      const emoji = data.emojis[id];
      if (!emoji) continue;

      const button = document.createElement("button");
      button.className = `w-12 h-12 border-none rounded-md cursor-pointer
        flex items-center justify-center transition-colors duration-200
        p-2 hover:bg-[#f3f4f6] text-2xl`;

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

  const addCategory = (title: string, key: string, emojiIds: string[]) => {
    addHeader(title, key);
    addGrid(emojiIds);
  };

  const showEmpty = (message: string) => {
    const el = document.createElement("div");
    el.style.cssText =
      "text-align:center;padding:40px 20px;color:#6b7280;font-size:14px;";
    el.textContent = message;
    container.appendChild(el);
  };

  const reset = () => {
    container.innerHTML = "";
    buttons.length = 0;
    grids.length = 0;
    focusedIdx = -1;
    desiredCol = 0;
    container.removeEventListener("mousemove", handleMouseMove);
  };

  const handleKey = (event: KeyboardEvent): boolean => {
    if (!buttons.length) return false;
    const delta = MOVES[event.key];
    if (!delta) return false;
    event.preventDefault();
    move(delta[0], delta[1]);
    return true;
  };

  const getFocusedButton = () => (focusedIdx >= 0 ? buttons[focusedIdx] : null);

  return {
    addCategory,
    addGrid,
    showEmpty,
    reset,
    handleKey,
    setFocus,
    getFocusedButton,
  };
}
