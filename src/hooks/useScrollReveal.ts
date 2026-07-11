import { useEffect, useRef, useState } from "react";

type UseScrollRevealOptions = {
  threshold?: number;
  unobserve?: boolean;
  rootMargin?: string;
};

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options?: UseScrollRevealOptions,
) {
  const { threshold = 0.15, unobserve = true, rootMargin = "0px" } = options ?? {};
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
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
