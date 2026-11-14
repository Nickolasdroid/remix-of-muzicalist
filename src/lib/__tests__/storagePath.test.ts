import { describe, expect, it } from "vitest";
import { storagePathFromUrl, storagePathsIn } from "../storagePath";

const base = "https://fpqvupbqoqsalrfahvab.supabase.co/storage/v1/object/public/avatars/";

describe("storage paths", () => {
  it("extracts the path of an image in the gallery (the old code kept 'avatars/' in front)", () => {
    expect(storagePathFromUrl(`${base}u1/gallery/1700_a.jpg`)).toBe("u1/gallery/1700_a.jpg");
  });
  it("handles videos, query strings and encoded names", () => {
    expect(storagePathFromUrl(`${base}u1/gallery/videos/1700_clip.mp4`)).toBe("u1/gallery/videos/1700_clip.mp4");
    expect(storagePathFromUrl(`${base}u1/avatar.jpg?v=123`)).toBe("u1/avatar.jpg");
    expect(storagePathFromUrl(`${base}u1/gallery/a%20b.jpg`)).toBe("u1/gallery/a b.jpg");
  });
  it("ignores foreign or empty URLs", () => {
    expect(storagePathFromUrl("https://example.com/x.jpg")).toBeNull();
    expect(storagePathFromUrl(null)).toBeNull();
  });
  it("finds every file mentioned in a row", () => {
    const row = { media_url: `${base}u1/posts/a.jpg`, media: [{ url: `${base}u1/posts/b.jpg` }, { url: "https://youtu.be/x" }] };
    expect(storagePathsIn(row).sort()).toEqual(["u1/posts/a.jpg", "u1/posts/b.jpg"]);
    expect(storagePathsIn(null)).toEqual([]);
  });
});
