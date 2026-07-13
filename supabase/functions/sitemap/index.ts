import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Public, unauthenticated endpoint that generates sitemap.xml on the fly
// from the live database: all active artist profiles (by slug), plus the
// dynamic category / county / country listing pages, plus the static pages.
//
// URL: https://ccdgoduekpiesdmkluff.supabase.co/functions/v1/sitemap
// Referenced from: public/robots.txt on muzicalist.com
// (cross-domain sitemaps are valid when declared via robots.txt)

const SITE = "https://muzicalist.com";

const STATIC_PAGES: Array<[path: string, changefreq: string, priority: string]> = [
  ["/", "weekly", "1.0"],
  ["/artists", "daily", "0.9"],
  ["/categories", "weekly", "0.9"],
  ["/countries", "weekly", "0.9"],
  ["/counties", "weekly", "0.8"],
  ["/feed", "daily", "0.8"],
  ["/announcements", "daily", "0.8"],
  ["/leaderboard", "weekly", "0.8"],
  ["/about", "monthly", "0.7"],
  ["/plans", "monthly", "0.7"],
  ["/search", "weekly", "0.7"],
  ["/register", "monthly", "0.6"],
  ["/register/artist", "monthly", "0.6"],
  ["/register/user", "monthly", "0.6"],
  ["/help", "monthly", "0.5"],
  ["/login", "monthly", "0.4"],
  ["/privacy-policy", "yearly", "0.3"],
  ["/terms-of-service", "yearly", "0.3"],
];

const xmlEscape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const urlTag = (
  loc: string,
  changefreq?: string,
  priority?: string,
  lastmod?: string,
) =>
  "  <url>" +
  `<loc>${xmlEscape(loc)}</loc>` +
  (lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : "") +
  (changefreq ? `<changefreq>${changefreq}</changefreq>` : "") +
  (priority ? `<priority>${priority}</priority>` : "") +
  "</url>";

serve(async (_req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Public artist profiles — same filter the site's own listings use.
    // Paginated in batches of 1000 (PostgREST default cap) so the sitemap
    // keeps working as the platform grows.
    type Row = {
      slug: string | null;
      specialization: string | null;
      county: string | null;
      country: string | null;
      updated_at: string | null;
    };
    const artists: Row[] = [];
    const BATCH = 1000;
    for (let from = 0; ; from += BATCH) {
      const { data, error } = await supabase
        .from("profiles")
        .select("slug, specialization, county, country, updated_at")
        .not("specialization", "is", null)
        .not("slug", "is", null)
        .order("created_at", { ascending: true })
        .range(from, from + BATCH - 1);
      if (error) throw error;
      artists.push(...(data ?? []));
      if (!data || data.length < BATCH) break;
    }

    const lines: string[] = [];

    for (const [path, cf, pr] of STATIC_PAGES) {
      lines.push(urlTag(`${SITE}${path}`, cf, pr));
    }

    // Dynamic listing pages, derived from real data
    const categories = new Set<string>();
    const counties = new Set<string>();
    const countries = new Set<string>();
    for (const a of artists) {
      if (a.specialization) categories.add(a.specialization);
      if (a.county) counties.add(a.county);
      if (a.country) countries.add(a.country);
    }
    for (const c of [...categories].sort()) {
      lines.push(urlTag(`${SITE}/categories/${encodeURIComponent(c)}`, "weekly", "0.8"));
    }
    for (const c of [...counties].sort()) {
      lines.push(urlTag(`${SITE}/counties/${encodeURIComponent(c)}`, "weekly", "0.7"));
    }
    for (const c of [...countries].sort()) {
      lines.push(urlTag(`${SITE}/countries/${encodeURIComponent(c)}`, "weekly", "0.7"));
    }

    // Artist profiles — the most valuable pages
    for (const a of artists) {
      lines.push(
        urlTag(`${SITE}/artist/${a.slug}`, "weekly", "0.8", a.updated_at ?? undefined),
      );
    }

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      lines.join("\n") +
      `\n</urlset>\n`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        // Crawlers may fetch often; cache at the edge for an hour.
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("sitemap generation failed:", err);
    return new Response("Internal error generating sitemap", { status: 500 });
  }
});
