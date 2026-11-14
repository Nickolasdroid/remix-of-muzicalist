// Serves the platform's stored UI translations (table: ui_text_translations).
// Public edge function (no extra secrets). It does NOT call any AI service: strings that have
// no stored translation come back unchanged and the response is flagged `degraded`, which makes
// the app stop asking for new translations for a while (see src/i18n/index.ts).
//
// Request bodies:
//   { dump: true, targetLang: "ro" }                       -> every stored translation for a language
//   { targetLang: "ro", texts: ["Home", "Search"] }         -> stored translations for those strings
//   { targetLang: "ro", sourceLang?: "en", source: {...} }  -> a whole locale file: not available
//                                                              without AI, answered as degraded
//
// Response: { translations: ..., degraded?: true, reason?: "ai_disabled" }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const normLang = (l: string) => (l || "en").split("-")[0].toLowerCase();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const degraded = (translations: unknown) =>
  json({ translations, degraded: true, reason: "ai_disabled" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetLang, texts, source, dump } = await req.json();

    // Dump mode: the ENTIRE stored dictionary for a language in one call. The client uses this
    // at startup to seed its local cache.
    if (dump === true && targetLang) {
      const lang = normLang(targetLang);
      const out: Record<string, string> = {};
      const BATCH = 1000;
      for (let from = 0; ; from += BATCH) {
        const { data, error } = await admin
          .from("ui_text_translations")
          .select("source_text, translated_text")
          .eq("lang", lang)
          .range(from, from + BATCH - 1);
        if (error) throw error;
        for (const row of data ?? []) out[row.source_text] = row.translated_text;
        if (!data || data.length < BATCH) break;
      }
      return json({ translations: out });
    }

    if (!targetLang || typeof targetLang !== "string") {
      return json({ error: "targetLang required" }, 400);
    }

    if (Array.isArray(texts)) {
      const cleanTexts = texts
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 120);

      if (cleanTexts.length === 0) return json({ translations: [] });

      const lang = normLang(targetLang);
      const stored: Record<string, string> = {};
      try {
        const { data } = await admin
          .from("ui_text_translations")
          .select("source_text, translated_text")
          .eq("lang", lang)
          .in("source_text", cleanTexts);
        for (const row of data ?? []) stored[row.source_text] = row.translated_text;
      } catch (e) {
        console.error("translation lookup failed", e);
      }

      const ordered = cleanTexts.map((t) => stored[t] ?? t);
      if (cleanTexts.every((t) => t in stored)) return json({ translations: ordered });
      return degraded(ordered);
    }

    if (!source || typeof source !== "object") {
      return json({ error: "source object required" }, 400);
    }
    // Translating a whole locale file needs an AI service; there is none.
    return degraded(null);
  } catch (e) {
    console.error("translate-locale error", e);
    return json({ error: "Translation lookup failed" }, 500);
  }
});
