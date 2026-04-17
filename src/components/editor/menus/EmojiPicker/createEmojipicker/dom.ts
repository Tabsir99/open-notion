import { getEmojiData } from "./data";
import { getEmojiUrl } from "../getEmojiUrl";
import { categoryId } from "./category";

export const COLUMN_COUNT = 10;

export function createEmojiGrid(scroll: HTMLDivElement) {
  const buttons: HTMLButtonElement[] = [];
  const grids: { start: number; count: number }[] = [];
  const categoryKeys: string[] = [];
  const timers: number[] = [];
  const headers: HTMLElement[] = [];

  const addHeader = (title: string) => {
    const header = document.createElement("div");
    header.className =
      "font-semibold text-sm text-gray-700 p-2 pb-1 pl-3.5 sticky top-0 bg-background z-10 capitalize";
    header.textContent = title;
    scroll.appendChild(header);
    headers.push(header);
  };

  const addGrid = (emojiIds: string[]) => {
    const data = getEmojiData();
    if (!data) return;

    const startIdx = buttons.length;
    const grid = document.createElement("div");
    grid.style.cssText = `display:grid;grid-template-columns:repeat(${COLUMN_COUNT},minmax(48px,1fr));padding:8px`;
    scroll.appendChild(grid);

    for (let i = 0; i < emojiIds.length; i++) {
      const emoji = data.emojis[emojiIds[i]];
      if (!emoji) continue;

      const button = document.createElement("button");
      button.className =
        "w-12 h-12 border-none rounded-md cursor-pointer flex items-center justify-center transition-colors duration-200 p-2 hover:bg-[#f3f4f6] text-2xl";

      const img = document.createElement("img");
      img.src = getEmojiUrl(emoji.id, "picker-grid");
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

  const addCategory = (title: string, id: string, ids: string[]) => {
    addHeader(title);
    const beforeCount = buttons.length;
    const before = grids.length;
    addGrid(ids);
    const firstBtn = buttons[beforeCount];
    if (firstBtn) firstBtn.id = categoryId(id);
    if (grids.length > before) categoryKeys.push(id);
  };

  const getGridIdxForKey = (key: string) => categoryKeys.indexOf(key);

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
    scroll.innerHTML = "";
    buttons.length = 0;
    grids.length = 0;
    headers.length = 0;
  };

  return {
    buttons,
    grids,
    timers,
    addCategory,
    showEmpty,
    clear,
    getGridIdxForKey,
    destroy: () => {
      clear();
    },
  };
}
