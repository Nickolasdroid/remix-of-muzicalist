import { Component, ReactNode } from "react";

const isChunkLoadError = (error: unknown) => {
  const msg = String((error as { message?: string } | null)?.message ?? error ?? "");
  return /dynamically imported module|Loading chunk|Loading CSS chunk|Importing a module script failed|error loading dynamically/i.test(msg);
};

/** Shows a reload prompt instead of a blank screen when a page fails to load or render. */
export default class ChunkErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; chunk: boolean }
> {
  state = { failed: false, chunk: false };
  static getDerivedStateFromError(error: unknown) {
    return { failed: true, chunk: isChunkLoadError(error) };
  }
  componentDidCatch(error: unknown) {
    // Only a failed download means "new version"; anything else is a real error worth seeing.
    if (!isChunkLoadError(error)) console.error("Page error:", error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-foreground">
          {this.state.chunk
            ? "A new version of Muzicalist is available."
            : "Something went wrong while showing this page."}
        </p>
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
