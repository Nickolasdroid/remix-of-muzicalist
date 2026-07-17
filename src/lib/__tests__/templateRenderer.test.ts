import { describe, it, expect } from "vitest";
import { renderTemplate, renderString, escapeHtml } from "../templateRenderer";

describe("templateRenderer.renderTemplate", () => {
  it("substitutes known variables in subject/html/text", () => {
    const out = renderTemplate({
      subject: "Hi {{user.first_name}}",
      html: "<p>Hello {{user.first_name}}</p>",
      text: "Hello {{user.first_name}}",
      variables: { "user.first_name": "Alex", "user.email": "a@b.co" },
    });
    expect(out.subject).toBe("Hi Alex");
    expect(out.html).toBe("<p>Hello Alex</p>");
    expect(out.text).toBe("Hello Alex");
    expect(out.usedVariables).toContain("user.first_name");
    expect(out.ok).toBe(true);
  });

  it("HTML-escapes substituted values in html but not text/subject", () => {
    const out = renderTemplate({
      subject: "{{user.first_name}}",
      html: "<b>{{user.first_name}}</b>",
      text: "{{user.first_name}}",
      variables: { "user.first_name": "<script>x</script>", "user.email": "a@b.co" },
    });
    expect(out.html).toBe("<b>&lt;script&gt;x&lt;/script&gt;</b>");
    expect(out.subject).toBe("<script>x</script>");
    expect(out.text).toBe("<script>x</script>");
  });

  it("preserves unknown tokens verbatim and warns", () => {
    const out = renderTemplate({
      text: "Hi {{nope.field}}",
      variables: { "user.email": "a@b.co" },
    });
    expect(out.text).toBe("Hi {{nope.field}}");
    expect(out.unknownVariables).toEqual(["nope.field"]);
    expect(out.warnings.some((w) => w.type === "unknown_variable")).toBe(true);
  });

  it("warns on malformed tokens and leaves them intact", () => {
    const out = renderTemplate({
      text: "{{ BAD Token }} plus {{}}",
      variables: { "user.email": "a@b.co" },
    });
    expect(out.text).toContain("{{ BAD Token }}");
    expect(out.warnings.filter((w) => w.type === "malformed_token").length).toBeGreaterThanOrEqual(2);
  });

  it("returns missing_required error when a referenced required var is empty", () => {
    const out = renderTemplate({
      text: "Email: {{user.email}}",
      variables: { "user.email": "" },
    });
    expect(out.ok).toBe(false);
    expect(out.errors[0].type).toBe("missing_required");
    expect(out.missingVariables).toContain("user.email");
  });

  it("does NOT flag required vars that are not referenced", () => {
    const out = renderTemplate({
      text: "Static text",
      variables: {},
    });
    expect(out.ok).toBe(true);
    expect(out.missingVariables).toEqual([]);
  });

  it("supplies empty string for registered but unset values (warning only)", () => {
    const out = renderTemplate({
      text: "City: {{artist.city}}",
      variables: {},
    });
    expect(out.text).toBe("City: ");
    expect(out.warnings.some((w) => w.type === "unregistered_value")).toBe(true);
    expect(out.ok).toBe(true);
  });

  it("respects escapeHtmlValues=false", () => {
    const out = renderTemplate({
      html: "<i>{{user.first_name}}</i>",
      variables: { "user.first_name": "<b>x</b>", "user.email": "a@b.co" },
      escapeHtmlValues: false,
    });
    expect(out.html).toBe("<i><b>x</b></i>");
  });
});

describe("renderString", () => {
  it("renders a single field without HTML escaping", () => {
    const out = renderString("Hi {{user.first_name}}", {
      "user.first_name": "<x>",
      "user.email": "a@b.co",
    });
    expect(out.text).toBe("Hi <x>");
  });
});

describe("escapeHtml", () => {
  it("escapes all five special characters", () => {
    expect(escapeHtml(`<a href="'&">`)).toBe("&lt;a href=&quot;&#39;&amp;&quot;&gt;");
  });
});
