// Translates a locale JSON dictionary into a target language using Lovable AI.
// Public edge function (no JWT required).
//
// Request body:
//   { targetLang: "fr", sourceLang?: "en", source: { key: "value", nested: { ... } } }
//   { targetLang: "fr", sourceLang?: "auto", texts: ["Home", "Search"] }
//
// Response:
//   { translations: { ...same shape as source, all string leaves translated... } }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

function flattenLeaves(obj: any, prefix = "", out: Record<string, string> = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flattenLeaves(v, path, out);
    } else if (typeof v === "string") {
      out[path] = v;
    }
  }
  return out;
}

function unflatten(map: Record<string, string>) {
  const out: any = {};
  for (const [path, val] of Object.entries(map)) {
    const parts = path.split(".");
    let cur = out;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] ??= {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
  }
  return out;
}

function safeJsonParse(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { targetLang, sourceLang = "en", source, texts } = await req.json();

    if (!targetLang || typeof targetLang !== "string") {
      return new Response(JSON.stringify({ error: "targetLang required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (Array.isArray(texts)) {
      const cleanTexts = texts
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 120);

      if (cleanTexts.length === 0) {
        return new Response(JSON.stringify({ translations: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const systemPrompt =
        `You are a professional website localization translator. Translate each UI string to ${targetLang}. ` +
        `The source strings may be English, mixed languages, or already in ${targetLang}; if already correct, return it unchanged. ` +
        `Preserve brand names such as Muzicalist, people's names, country/place names when appropriate, emojis, numbers, URLs, email addresses, placeholders like {{name}}, {0}, %s, and HTML tags exactly. ` +
        `Return ONLY JSON in this exact shape: {"translations":["..."]}. Keep the same order and count.`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify({ texts: cleanTexts }) },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!aiRes.ok) {
        const text = await aiRes.text();
        console.error("AI gateway error", aiRes.status, text);
        return new Response(JSON.stringify({ error: "AI gateway error", status: aiRes.status, detail: text }), {
          status: aiRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiJson = await aiRes.json();
      const content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";
      const parsed = safeJsonParse(content);
      const translated = Array.isArray(parsed?.translations) ? parsed.translations : [];
      const ordered = cleanTexts.map((text, index) =>
        typeof translated[index] === "string" && translated[index].trim() ? translated[index] : text
      );

      return new Response(JSON.stringify({ translations: ordered }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!source || typeof source !== "object") {
      return new Response(JSON.stringify({ error: "source object required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const flat = flattenLeaves(source);
    const keys = Object.keys(flat);
    if (keys.length === 0) {
      return new Response(JSON.stringify({ translations: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt =
      `You are a professional UI localization translator. Translate UI strings from ${sourceLang} to ${targetLang}. ` +
      `Preserve placeholders like {{name}}, {0}, %s exactly. Preserve HTML tags. ` +
      `Keep tone friendly and concise, suitable for a web app. ` +
      `Return ONLY a JSON object that maps each input key to its translated string. ` +
      `Do NOT add or remove keys. Do NOT add commentary.`;

    const userPayload = JSON.stringify(flat);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPayload },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("AI gateway error", aiRes.status, text);
      return new Response(
        JSON.stringify({ error: "AI gateway error", status: aiRes.status, detail: text }),
        { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiJson = await aiRes.json();
    const content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";

    let translatedFlat: Record<string, string>;
    try {
      const parsed = safeJsonParse(content);
      translatedFlat = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (e) {
      console.error("Failed to parse AI JSON", content);
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fill any missing keys with the source string as a safe fallback
    for (const k of keys) {
      if (typeof translatedFlat[k] !== "string" || !translatedFlat[k].trim()) {
        translatedFlat[k] = flat[k];
      }
    }

    const translations = unflatten(translatedFlat);

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("translate-locale error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
