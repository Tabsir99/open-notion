export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type Size = { width: number; height: number };

type StartResizeOpts = {
  direction: ResizeDirection;
  event: React.MouseEvent | MouseEvent;
  element: HTMLElement;
  minWidth?: number;
  minHeight?: number;
  /** width / height — required for any constrained resize */
  aspectRatio: number;
  /** whether edge handles should also constrain the ratio */
  locked?: boolean;
  onEnd: (size: Size) => void;
  containerSize: Size;
};

const CORNER_DIRS = new Set<ResizeDirection>(["ne", "nw", "se", "sw"]);

const CURSOR_MAP: Record<ResizeDirection, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};

export function startImageResize({
  direction,
  event,
  element,
  minWidth = 40,
  minHeight = 40,
  aspectRatio,
  locked = false,
  onEnd,
  containerSize,
}: StartResizeOpts): void {
  event.preventDefault();
  event.stopPropagation();

  const startX = event.clientX;
  const startY = event.clientY;
  const startW = element.offsetWidth;
  const startH = element.offsetHeight;

  const isCorner = CORNER_DIRS.has(direction);
  // Corners always constrain. Edges constrain only when locked.
  const constrain = (isCorner || locked) && aspectRatio > 0;

  const movesRight = direction.includes("e");
  const movesLeft = direction.includes("w");
  const movesDown = direction.includes("s");
  const movesUp = direction.includes("n");

  // For constrained resize: width is the primary axis when the direction has an
  // east/west component (all corners + e/w edges). Height is primary only for
  // pure n/s edges.
  const widthPrimary = movesRight || movesLeft;

  const prevCursor = document.body.style.cursor;
  const prevSelect = document.body.style.userSelect;
  document.body.style.cursor = CURSOR_MAP[direction];
  document.body.style.userSelect = "none";
  element.style.willChange = "width, height";

  let latest: Size = { width: startW, height: startH };

  let rafId: number | null = null;

  const onMove = (ev: MouseEvent) => {
    if (rafId !== null) return; // already one queued

    rafId = requestAnimationFrame(() => {
      rafId = null;

      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      let nextW = startW;
      let nextH = startH;

      if (movesRight) nextW = startW + dx;
      else if (movesLeft) nextW = startW - dx;

      if (movesDown) nextH = startH + dy;
      else if (movesUp) nextH = startH - dy;

      nextW = Math.max(minWidth, nextW);
      nextH = Math.max(minHeight, nextH);

      if (containerSize) {
        nextW = Math.min(nextW, containerSize.width);
      }

      if (constrain) {
        if (widthPrimary) {
          nextH = nextW / aspectRatio;
        } else {
          nextW = nextH * aspectRatio;
        }
        nextW = Math.max(minWidth, nextW);
        nextH = Math.max(minHeight, nextH);
      }

      latest = { width: Math.round(nextW), height: Math.round(nextH) };

      element.style.width = `${latest.width}px`;
      element.style.height = `${latest.height}px`;
    });
  };

  const onUp = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("mouseup", onUp);
    document.body.style.cursor = prevCursor;
    document.body.style.userSelect = prevSelect;
    element.style.willChange = "";
    onEnd(latest);
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("mouseup", onUp);
}

export const RESIZE_HANDLES: Array<{
  dir: ResizeDirection;
  className: string;
}> = [
  // Sides — thin strips along each edge (free resize, or locked if toggle is on)
  {
    dir: "n",
    className: "top-0 left-0 right-0 h-3 -translate-y-1/2 cursor-ns-resize",
  },
  {
    dir: "s",
    className: "bottom-0 left-0 right-0 h-3 translate-y-1/2 cursor-ns-resize",
  },
  {
    dir: "e",
    className: "top-0 bottom-0 right-0 w-3 translate-x-1/2 cursor-ew-resize",
  },
  {
    dir: "w",
    className: "top-0 bottom-0 left-0 w-3 -translate-x-1/2 cursor-ew-resize",
  },
  // Corners — always constrain aspect ratio regardless of lock toggle
  {
    dir: "nw",
    className:
      "top-0 left-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
  },
  {
    dir: "ne",
    className:
      "top-0 right-0 h-4 w-4 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
  },
  {
    dir: "sw",
    className:
      "bottom-0 left-0 h-4 w-4 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
  },
  {
    dir: "se",
    className:
      "bottom-0 right-0 h-4 w-4 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  },
];
