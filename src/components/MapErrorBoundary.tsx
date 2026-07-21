import { Component, type ReactNode } from "react";

// A WebGL map is the most crash-prone surface on the page (driver loss,
// style races, memory pressure). If it throws, degrade to a quiet bordered
// panel instead of letting React unmount the whole site — which is exactly
// what happened when a theme flip raced the basemap style load (spec 043).
export class MapErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          role="status"
          className="flex h-[560px] flex-col items-center justify-center gap-2 rounded-lg border border-border p-6 text-center"
        >
          <p className="text-sm font-medium text-foreground">
            The map hit an error.
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Reload the page to restore it. The rest of the site is unaffected.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
