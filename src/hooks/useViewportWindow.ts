import { useEffect, useRef, useState } from "react";

// Unlike useScrollReveal (a one-shot "reveal once, stay revealed" gate for
// animations), this reports viewport proximity that toggles BOTH ways: true
// when the element is near the viewport, false again once it scrolls well
// clear. ChartReveal uses it to keep only the on-screen charts mounted —
// iOS Safari silently purges the backing store of off-screen <canvas>
// elements to reclaim memory, and Chart.js has no way to know it must
// repaint, so a purged canvas returns blank. Mounting a fresh canvas each
// time the chart re-enters view sidesteps that entirely, and caps the number
// of live canvases (and their memory) to what's actually visible.
//
// The generous rootMargin mounts a chart before it scrolls into view (so the
// draw animation is ready) and only unmounts it once it's comfortably off
// screen. Because ChartReveal's parent fixes the box height, the skeleton and
// the chart occupy an identical space — swapping them never moves the page,
// so the observer can't thrash at the boundary.
export function useViewportWindow<T extends HTMLElement = HTMLDivElement>(
  rootMargin = "600px 0px",
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
