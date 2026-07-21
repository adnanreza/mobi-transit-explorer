import { useEffect, useRef, useState } from "react";

type UseScrollRevealOptions = {
  threshold?: number;
  unobserve?: boolean;
  rootMargin?: string;
};

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options?: UseScrollRevealOptions,
) {
  // threshold 0, not a ratio: a fractional threshold can never fire for an
  // element taller than the viewport (its intersectionRatio maxes out at
  // viewport/element height), which left whole sections stuck at opacity 0
  // on phones. Any visible pixel now reveals — the animation is a garnish,
  // never a gate on content.
  const { threshold = 0, unobserve = true, rootMargin = "0px" } = options ?? {};
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (unobserve) observer.unobserve(el);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, unobserve, rootMargin]);

  return { ref, isVisible };
}
