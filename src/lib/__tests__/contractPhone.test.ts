import { describe, expect, it } from "vitest";
import { isValidPhone } from "../contracts";

describe("isValidPhone", () => {
  it("accepts Romanian and international numbers", () => {
    expect(isValidPhone("0722 123 456")).toBe(true);
    expect(isValidPhone("+40 722-123-456")).toBe(true);
    expect(isValidPhone("(0264) 123.456")).toBe(true);
  });
  it("rejects empty, short or non-numeric values", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone(null)).toBe(false);
    expect(isValidPhone("0722")).toBe(false);
    expect(isValidPhone("call me")).toBe(false);
  });
});
