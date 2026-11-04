import { describe, expect, it } from "vitest";
import { embedSrc, findEmbed, parseEmbedUrl } from "@/lib/mediaEmbeds";

describe("parseEmbedUrl", () => {
  it("reads YouTube links in every common shape", () => {
    expect(parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ?si=abc")).toMatchObject({ provider: "youtube", id: "dQw4w9WgXcQ" });
    expect(parseEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s")).toMatchObject({ id: "dQw4w9WgXcQ", start: 90 });
    expect(parseEmbedUrl("youtube.com/shorts/dQw4w9WgXcQ")).toMatchObject({ id: "dQw4w9WgXcQ" });
    expect(parseEmbedUrl("https://music.youtube.com/watch?v=dQw4w9WgXcQ")).toMatchObject({ id: "dQw4w9WgXcQ" });
    expect(parseEmbedUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toMatchObject({ id: "dQw4w9WgXcQ" });
  });
  it("rejects YouTube pages that are not a video", () => {
    expect(parseEmbedUrl("https://www.youtube.com/@artist")).toBeNull();
    expect(parseEmbedUrl("https://youtu.be/short")).toBeNull();
  });
  it("reads Spotify tracks, albums and localized links", () => {
    expect(parseEmbedUrl("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=x")).toMatchObject({ provider: "spotify", kind: "track", id: "4uLU6hMCjMI75M1A2tKUQC" });
    expect(parseEmbedUrl("https://open.spotify.com/intl-ro/album/1DFixLWuPkv3KT3TnV35m3")).toMatchObject({ kind: "album" });
  });
  it("reads SoundCloud tracks but not its app pages", () => {
    expect(parseEmbedUrl("https://soundcloud.com/artist/my-song")).toMatchObject({ provider: "soundcloud" });
    expect(parseEmbedUrl("https://soundcloud.com/discover/sets")).toBeNull();
    expect(parseEmbedUrl("https://soundcloud.com/artist")).toBeNull();
  });
});

describe("findEmbed", () => {
  it("finds the first playable link in post text, ignoring trailing punctuation", () => {
    const e = findEmbed("Cea mai nouă piesă: https://youtu.be/dQw4w9WgXcQ. Fără AI.");
    expect(e).toMatchObject({ provider: "youtube", id: "dQw4w9WgXcQ" });
  });
  it("returns null without a supported link", () => {
    expect(findEmbed("Concert diseară la https://muzicalist.com")).toBeNull();
    expect(findEmbed("")).toBeNull();
  });
});

describe("embedSrc", () => {
  it("uses privacy-enhanced YouTube with the start time", () => {
    const src = embedSrc({ provider: "youtube", id: "dQw4w9WgXcQ", url: "", start: 90 });
    expect(src).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(src).toContain("start=90");
  });
});

import { availabilityState, isDayUnpickable } from "@/lib/availability";

describe("availabilityState", () => {
  it("is free on an empty or available day", () => {
    expect(availabilityState(undefined)).toBe("free");
    expect(availabilityState({ status: "available", slots: [] }, "18:00", "02:00")).toBe("free");
  });
  it("is taken on blocked or all-day bookings", () => {
    expect(availabilityState({ status: "blocked", slots: [] })).toBe("taken");
    expect(availabilityState({ status: "booked", slots: [] }, "18:00", "23:00")).toBe("taken");
  });
  it("checks only the announced interval on partly booked days", () => {
    const day = { status: "booked", slots: [{ startTime: "12:00", endTime: "16:00" }] };
    expect(availabilityState(day, "18:00", "02:00")).toBe("free");
    expect(availabilityState(day, "15:00", "20:00")).toBe("taken");
    expect(availabilityState(day)).toBe("free");
  });
  it("handles intervals past midnight", () => {
    const day = { status: "booked", slots: [{ startTime: "22:00", endTime: "03:00" }] };
    expect(availabilityState(day, "18:00", "23:00")).toBe("taken");
    expect(availabilityState(day, "10:00", "14:00")).toBe("free");
  });
  it("blocks picking fully booked or unavailable days", () => {
    expect(isDayUnpickable({ status: "blocked", slots: [] })).toBe(true);
    expect(isDayUnpickable({ status: "booked", slots: [{ startTime: "12:00", endTime: "16:00" }] })).toBe(false);
  });
});
