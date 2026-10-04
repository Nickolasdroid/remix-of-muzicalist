import { Component, ReactNode } from "react";

/** Shows a reload prompt instead of a blank screen when a page fails to load. */
export default class ChunkErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-foreground">A new version of Muzicalist is available.</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-foreground"
        >
          Reload
        </button>
      </div>
    );
  }
}
