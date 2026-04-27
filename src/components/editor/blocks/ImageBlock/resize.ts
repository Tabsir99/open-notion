export type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type Size = { width: number; height: number };

type StartResizeOpts = {
  direction: ResizeDirection;
  event: React.MouseEvent | MouseEvent;
  element: HTMLElement;
  minWidth?: number;
  minHeight?: number;
  onEnd: (size: Size) => void;
};

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
  onEnd,
}: StartResizeOpts): void {
  event.preventDefault();
  event.stopPropagation();

  const startX = event.clientX;
  const startY = event.clientY;
  const startW = element.offsetWidth;
  const startH = element.offsetHeight;

  const movesRight = direction.includes("e");
  const movesLeft = direction.includes("w");
  const movesDown = direction.includes("s");
  const movesUp = direction.includes("n");

  // Lock cursor + selection globally during drag
  const prevCursor = document.body.style.cursor;
  const prevSelect = document.body.style.userSelect;
  document.body.style.cursor = CURSOR_MAP[direction];
  document.body.style.userSelect = "none";

  let latest: Size = { width: startW, height: startH };

  const onMove = (ev: MouseEvent) => {
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

    latest = { width: Math.round(nextW), height: Math.round(nextH) };

    // Imperative — bypasses React entirely
    element.style.width = `${latest.width}px`;
    element.style.height = `${latest.height}px`;
  };

  const onUp = () => {
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    document.body.style.cursor = prevCursor;
    document.body.style.userSelect = prevSelect;
    onEnd(latest);
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}

export const RESIZE_HANDLES: Array<{
  dir: ResizeDirection;
  className: string;
}> = [
  // Sides — thin strips along each edge
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
  // Corners — small squares overlapping each corner (rendered after sides → higher z via DOM order)
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
