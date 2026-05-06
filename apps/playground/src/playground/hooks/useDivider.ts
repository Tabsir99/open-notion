import { useCallback, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

const MIN_PCT = 28;
const MAX_PCT = 72;

export function useDivider(initialPct = 50) {
  const [leftPct, setLeftPct] = useState(initialPct);
  const splitRef = useRef<HTMLDivElement>(null);

  const onDividerMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      const wrap = splitRef.current;
      if (!wrap) return;

      const rect = wrap.getBoundingClientRect();
      const startX = e.clientX;
      const startPct = leftPct;

      const onMove = (ev: MouseEvent) => {
        const delta = ((ev.clientX - startX) / rect.width) * 100;
        setLeftPct(Math.min(MAX_PCT, Math.max(MIN_PCT, startPct + delta)));
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [leftPct],
  );

  return { leftPct, splitRef, onDividerMouseDown };
}