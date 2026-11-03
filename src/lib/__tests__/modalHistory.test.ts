import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const effects = vi.hoisted(() => [] as Array<() => void | (() => void)>);
vi.mock("react", () => ({
  useRef: (current: unknown) => ({ current }),
  useEffect: (effect: () => void | (() => void)) => effects.push(effect),
  useCallback: (callback: unknown) => callback,
  useState: (value: unknown) => [value, vi.fn()],
}));

describe("shared composer history", () => {
  let target: EventTarget;
  let entries: Record<string, unknown>[];
  let index: number;
  let pending: Array<() => void>;
  let mount: (close: () => void | boolean) => () => void;

  beforeEach(async () => {
    vi.resetModules();
    effects.length = 0;
    target = new EventTarget();
    entries = [{ page: "previous" }, { page: "feed" }];
    index = 1;
    pending = [];
    const go = vi.fn((delta: number) => {
      pending.push(() => {
        index += delta;
        target.dispatchEvent(new Event("popstate"));
      });
    });
    vi.stubGlobal("window", {
      addEventListener: target.addEventListener.bind(target),
      history: {
        get state() { return entries[index]; },
        pushState: (state: Record<string, unknown>) => {
          entries.splice(index + 1);
          entries.push(state);
          index += 1;
        },
        back: () => go(-1),
        go,
      },
    });
    const { useCloseOnBack } = await import("@/lib/modalHistory");
    mount = (close) => {
      useCloseOnBack(true, close);
      const effect = effects.pop();
      const cleanup = effect?.();
      return typeof cleanup === "function" ? cleanup : () => {};
    };
  });

  afterEach(() => vi.unstubAllGlobals());

  const flush = async () => {
    await Promise.resolve();
    while (pending.length) pending.shift()?.();
  };

  it("first Back closes a composer reopened after UI close without leaving the feed", async () => {
    const cleanup = mount(() => true);
    expect(index).toBe(2);
    cleanup();
    await flush();
    expect(index).toBe(1);
    const close = vi.fn(() => true);
    mount(close);
    window.history.back();
    await flush();
    expect(close).toHaveBeenCalledTimes(1);
    expect(index).toBe(1);
    expect(entries[index].page).toBe("feed");
  });

  it("busy or dirty veto restores exactly one composer entry", async () => {
    const close = vi.fn(() => false);
    mount(close);
    window.history.back();
    await flush();
    expect(close).toHaveBeenCalledTimes(1);
    expect(index).toBe(2);
    close.mockReturnValue(true);
    window.history.back();
    await flush();
    expect(close).toHaveBeenCalledTimes(2);
    expect(index).toBe(1);
  });

  it("Back dismisses only the nested discard confirmation", async () => {
    const composer = vi.fn(() => false);
    mount(composer);
    const confirmation = vi.fn();
    mount(confirmation);
    window.history.back();
    await flush();
    expect(confirmation).toHaveBeenCalledTimes(1);
    expect(composer).not.toHaveBeenCalled();
    expect(index).toBe(2);
  });

  it("discard removes both nested entries in one traversal", async () => {
    const composerCleanup = mount(() => false);
    const confirmationCleanup = mount(() => {});
    confirmationCleanup();
    composerCleanup();
    await flush();
    expect(window.history.go).toHaveBeenCalledExactlyOnceWith(-2);
    expect(index).toBe(1);
    const close = vi.fn(() => true);
    mount(close);
    window.history.back();
    await flush();
    expect(close).toHaveBeenCalledTimes(1);
    expect(index).toBe(1);
  });

  it("UI close does not traverse after navigating to a different page", async () => {
    const cleanup = mount(() => true);
    window.history.pushState({ page: "another" }, "");
    cleanup();
    await flush();
    expect(window.history.go).not.toHaveBeenCalled();
    expect(entries[index].page).toBe("another");
  });
});