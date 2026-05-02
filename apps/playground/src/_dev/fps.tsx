import { useEffect, useRef } from "react";

function fpsColor(fps: number) {
  if (fps >= 55) return "#1D9E75";
  if (fps >= 30) return "#EF9F27";
  return "#E24B4A";
}

export function FPSMonitor() {
  const fpsValRef = useRef<HTMLSpanElement>(null);
  const fpsDotRef = useRef<HTMLSpanElement>(null);
  const fpsBarRef = useRef<HTMLDivElement>(null);
  const ltValRef = useRef<HTMLSpanElement>(null);
  const ltWorstRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    function loop() {
      rafId = requestAnimationFrame(() => {
        frameCount++;
        const now = performance.now();
        const delta = now - lastTime;

        if (delta >= 500) {
          const fps = Math.round((frameCount * 1000) / delta);
          const c = fpsColor(fps);

          if (fpsValRef.current) {
            fpsValRef.current.textContent = String(fps);
            fpsValRef.current.style.color = c;
          }
          if (fpsDotRef.current) fpsDotRef.current.style.background = c;
          if (fpsBarRef.current) {
            fpsBarRef.current.style.width = `${Math.min(100, (fps / 60) * 100)}%`;
            fpsBarRef.current.style.background = c;
          }

          frameCount = 0;
          lastTime = now;
        }

        loop();
      });
    }

    loop();

    let observer: PerformanceObserver | null = null;
    let ltCount = 0;
    let ltMax = 0;

    if ("PerformanceObserver" in window) {
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            ltCount++;
            if (entry.duration > ltMax) ltMax = entry.duration;
            if (ltValRef.current)
              ltValRef.current.textContent = String(ltCount);
            if (ltWorstRef.current)
              ltWorstRef.current.textContent = `${Math.round(ltMax)}ms`;
          }
        });
        observer.observe({ type: "longtask", buffered: true });
      } catch {
        if (ltValRef.current) ltValRef.current.textContent = "n/a";
        if (ltWorstRef.current) ltWorstRef.current.textContent = "n/a";
      }
    } else {
      if (ltValRef.current) ltValRef.current.textContent = "n/a";
      if (ltWorstRef.current) ltWorstRef.current.textContent = "n/a";
    }

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, []);

  return (
    <div style={styles.wrap}>
      <div style={styles.row}>
        <span style={styles.label}>
          <span ref={fpsDotRef} style={styles.dot} />
          fps
        </span>
        <span ref={fpsValRef} style={styles.val}>
          —
        </span>
      </div>

      <div style={styles.barTrack}>
        <div ref={fpsBarRef} style={styles.barFill} />
      </div>

      <hr style={styles.divider} />

      <div style={styles.row}>
        <span style={styles.label}>long tasks</span>
        <span ref={ltValRef} style={styles.val}>
          0
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>worst</span>
        <span ref={ltWorstRef} style={styles.val}>
          —
        </span>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    bottom: 20,
    right: 20,
    background: "var(--color-background-primary, #fff)",
    border: "0.5px solid rgba(0,0,0,0.15)",
    borderRadius: 12,
    padding: "10px 14px",
    fontFamily: "monospace",
    fontSize: 12,
    minWidth: 180,
    userSelect: "none",
    zIndex: 9999,
  } as React.CSSProperties,

  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "3px 0",
  } as React.CSSProperties,

  label: {
    color: "var(--color-text-secondary, #888)",
    fontSize: 11,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
  } as React.CSSProperties,

  dot: {
    display: "inline-block",
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#888",
    marginRight: 6,
    transition: "background 0.3s",
  } as React.CSSProperties,

  val: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--color-text-primary, #111)",
    minWidth: 48,
    textAlign: "right",
    transition: "color 0.3s",
  } as React.CSSProperties,

  barTrack: {
    height: 3,
    borderRadius: 2,
    background: "var(--color-background-secondary, #f0f0f0)",
    marginTop: 8,
    overflow: "hidden",
  } as React.CSSProperties,

  barFill: {
    height: "100%",
    width: "0%",
    borderRadius: 2,
    transition: "width 0.4s, background 0.3s",
  } as React.CSSProperties,

  divider: {
    border: "none",
    borderTop: "0.5px solid rgba(0,0,0,0.1)",
    margin: "6px 0",
  } as React.CSSProperties,
} satisfies Record<string, React.CSSProperties>;
