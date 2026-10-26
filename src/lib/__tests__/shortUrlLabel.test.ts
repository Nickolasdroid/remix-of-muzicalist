import { describe, expect, it } from "vitest";
import { shortUrlLabel } from "@/components/ExpandableText";

describe("shortUrlLabel", () => {
  it("keeps the host and path, drops the query", () => {
    expect(shortUrlLabel("https://youtu.be/3Xq_xCCX5XI?is=fiopzCY867ukafsb")).toBe("youtu.be/3Xq_xCCX5XI");
    expect(shortUrlLabel("https://www.muzicalist.com/")).toBe("muzicalist.com");
  });
  it("shortens long links", () => {
    const label = shortUrlLabel("https://www.facebook.com/events/1234567890123456/permalink/987654321");
    expect(label.length).toBe(32);
    expect(label.endsWith("…")).toBe(true);
  });
});
