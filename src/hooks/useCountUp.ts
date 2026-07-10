import { useEffect, useRef, useState, type RefObject } from "react";

type ParsedValue = {
  prefix: string;
  target: number;
  decimals: number;
  suffix: string;
};

// Split a display string like "23.2M km" into countable parts.
// Exported for unit testing.
export function parseFormattedNumber(value: string): ParsedValue | null {
  const match = /^(\D*?)([\d,]+(?:\.\d+)?)(.*)$/.exec(value);
  if (!match) return null;
  const [, prefix, numeric, suffix] = match;
  const target = Number.parseFloat(numeric.replace(/,/g, ""));
  if (!Number.isFinite(target)) return null;
  const decimals = numeric.includes(".") ? numeric.split(".")[1].length : 0;
  return { prefix, target, decimals, suffix };
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

// Counts a formatted numeral up from zero (~1s) the first time it scrolls
// into view. Display state initializes to the FINAL string, so tests,
// reduced-motion users, and non-JS paints all see the real value with no
// animation machinery involved.
export function useCountUp<T extends HTMLElement = HTMLElement>(
  value: string,
  options?: { duration?: number },
): { ref: RefObject<T | null>; display: string } {
  const duration = options?.duration ?? 1000;
  const ref = useRef<T>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    setDisplay(value);
    const el = ref.current;
    const parsed = parseFormattedNumber(value);
    if (
      !el ||
      !parsed ||
      import.meta.env.MODE === "test" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let frame = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        if (t >= 1) {
          setDisplay(value); // final frame is the source string, verbatim
          return;
        }
        const current = parsed.target * easeOutCubic(t);
        setDisplay(
          `${parsed.prefix}${current.toLocaleString("en-CA", {
            minimumFractionDigits: parsed.decimals,
            maximumFractionDigits: parsed.decimals,
          })}${parsed.suffix}`,
        );
        frame = requestAnimationFrame(tick);
      };
      setDisplay(
        `${parsed.prefix}${(0).toLocaleString("en-CA", {
          minimumFractionDigits: parsed.decimals,
          maximumFractionDigits: parsed.decimals,
        })}${parsed.suffix}`,
      );
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return { ref, display };
}
