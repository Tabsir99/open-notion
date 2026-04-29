import { COLUMN_COUNT } from "./dom";

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

export function createNavigator(
  buttons: HTMLButtonElement[],
  grids: { start: number; count: number }[],
) {
  let focusedIdx = -1;
  let desiredCol = 0;

  const gridOf = (idx: number) =>
    grids.findIndex((g) => idx >= g.start && idx < g.start + g.count);

  const lastRowStart = (count: number) =>
    Math.floor((count - 1) / COLUMN_COUNT) * COLUMN_COUNT;

  const landAt = (gi: number, rowStart: number, col: number) => {
    const g = grids[gi];
    const rowLen = Math.min(COLUMN_COUNT, g.count - rowStart);
    return g.start + rowStart + Math.min(col, rowLen - 1);
  };

  const focusAt = (next: number, scroll = true) => {
    if (!buttons.length) return;
    const clamped = Math.max(0, Math.min(next, buttons.length - 1));
    if (clamped === focusedIdx) return;
    if (focusedIdx >= 0) buttons[focusedIdx].classList.remove(...FOCUSED_CLASS);
    buttons[clamped].classList.add(...FOCUSED_CLASS);
    if (scroll) {
      buttons[clamped].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
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

  const handleKey = (event: KeyboardEvent, onEnter: () => void): boolean => {
    if (!buttons.length) return false;
    if (event.key === "Enter") {
      event.preventDefault();
      onEnter();
      return true;
    }
    const delta = MOVES[event.key];
    if (!delta) return false;
    event.preventDefault();
    move(delta[0], delta[1]);
    return true;
  };

  const reset = () => {
    focusedIdx = -1;
    desiredCol = 0;
  };

  const setFocusToGrid = (gridIdx: number) => {
    if (gridIdx < 0 || gridIdx >= grids.length) return;
    focusAt(grids[gridIdx].start, false);
    desiredCol = 0;
  };

  const getFocusedIdx = () => focusedIdx;

  return { setFocus, move, handleKey, reset, getFocusedIdx, setFocusToGrid };
}
