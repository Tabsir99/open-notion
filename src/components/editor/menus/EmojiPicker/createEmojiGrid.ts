import { getEmojiData } from "./data";
import { getEmojiUrl } from "./getEmojiUrl";

export const COLUMN_COUNT = 10;
const className =
  "bg-accent outline outline-accent-foreground scroll-mt-10 scroll-mb-2.5";
const FOCUSED_CLASS = className.split(" ");

export type EmojiGridApi = ReturnType<typeof createEmojiGrid>;

export function createEmojiGrid(container: HTMLElement) {
  const buttons: HTMLButtonElement[] = [];
  let focusedIdx = -1;

  const setFocus = (next: number) => {
    if (!buttons.length) return;
    const clamped = Math.max(0, Math.min(next, buttons.length - 1));
    if (clamped === focusedIdx) return;

    if (focusedIdx >= 0 && focusedIdx < buttons.length) {
      buttons[focusedIdx].classList.remove(...FOCUSED_CLASS);
    }

    buttons[clamped].classList.add(...FOCUSED_CLASS);
    buttons[clamped].scrollIntoView({ block: "nearest", behavior: "smooth" });
    focusedIdx = clamped;
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
    const emojiData = getEmojiData();
    if (!emojiData) return;

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = `repeat(${COLUMN_COUNT}, minmax(48px, 1fr))`;
    grid.style.padding = "8px";
    container.appendChild(grid);

    for (const id of emojiIds) {
      const emoji = emojiData.emojis[id];
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
      buttons.push(button);
    }
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
    focusedIdx = -1;
  };

  const handleKey = (event: KeyboardEvent): boolean => {
    if (!buttons.length) return false;
    const total = buttons.length;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocus(focusedIdx < 0 ? 0 : focusedIdx + COLUMN_COUNT);
        return true;
      case "ArrowUp":
        event.preventDefault();
        setFocus(focusedIdx < 0 ? total - 1 : focusedIdx - COLUMN_COUNT);
        return true;
      case "ArrowRight":
        event.preventDefault();
        setFocus(focusedIdx < 0 ? 0 : focusedIdx + 1);
        return true;
      case "ArrowLeft":
        event.preventDefault();
        setFocus(focusedIdx < 0 ? total - 1 : focusedIdx - 1);
        return true;
      default:
        return false;
    }
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
