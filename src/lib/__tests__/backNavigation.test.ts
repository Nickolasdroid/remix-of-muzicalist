import { describe, expect, it } from "vitest";
import { isRootPath, parentPathFor } from "@/lib/backNavigation";

describe("back navigation", () => {
  it("knows the main pages", () => {
    expect(isRootPath("/feed")).toBe(true);
    expect(isRootPath("/dashboard")).toBe(true);
    expect(isRootPath("/artist/nick")).toBe(false);
    expect(isRootPath("/categories")).toBe(false);
  });

  it("falls back to the logical parent page", () => {
    expect(parentPathFor("/artist/nick/reviews", true)).toBe("/artist/nick");
    expect(parentPathFor("/artist/nick", true)).toBe("/feed");
    expect(parentPathFor("/artist/nick", false)).toBe("/artists");
    expect(parentPathFor("/book/abc", true)).toBe("/artist/abc");
    expect(parentPathFor("/counties/Cluj/DJ", true)).toBe("/counties/Cluj");
    expect(parentPathFor("/counties/Cluj", true)).toBe("/counties");
    expect(parentPathFor("/categories/DJ", false)).toBe("/categories");
    expect(parentPathFor("/leaderboard", false)).toBe("/");
  });
});
