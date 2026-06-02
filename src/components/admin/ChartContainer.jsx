import { useEffect, useRef, useState } from "react";

/**
 * Measures a stable pixel box before mounting Recharts.
 * Prevents ResponsiveContainer width/height -1 warnings when parent layout is not ready.
 */
export function ChartContainer({ height = 288, className = "", children, placeholder = "Preparing chart…" }) {
  const ref = useRef(null);
  const [size, setSize] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const heightPx = Math.floor(rect.height);
      if (width > 0 && heightPx > 0) {
        setSize((prev) => {
          if (prev?.width === width && prev?.height === heightPx) return prev;
          return { width, height: heightPx };
        });
      }
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [height]);

  return (
    <div
      ref={ref}
      className={`w-full min-w-0 ${className}`}
      style={{ height, minHeight: height }}
    >
      {size ? children(size) : (
        <div className="flex h-full items-center justify-center text-xs text-slate-400">{placeholder}</div>
      )}
    </div>
  );
}
