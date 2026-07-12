import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useViewportWindow } from "@/hooks/useViewportWindow";

// Drives the observed callback by hand so we can assert the both-ways toggle.
let fire: (isIntersecting: boolean) => void;

function Probe() {
  const { ref, inView } = useViewportWindow();
  return <div ref={ref} data-testid="probe" data-inview={String(inView)} />;
}

describe("useViewportWindow", () => {
  beforeEach(() => {
    class MockIO {
      constructor(cb: IntersectionObserverCallback) {
        fire = (isIntersecting: boolean) =>
          cb(
            [{ isIntersecting } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", MockIO);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("starts hidden, mounts when near the viewport, unmounts when far again", () => {
    const { getByTestId } = render(<Probe />);
    const el = getByTestId("probe");

    expect(el).toHaveAttribute("data-inview", "false");

    act(() => fire(true));
    expect(el).toHaveAttribute("data-inview", "true");

    act(() => fire(false));
    expect(el).toHaveAttribute("data-inview", "false");
  });
});
