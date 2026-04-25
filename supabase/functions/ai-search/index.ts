import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase env not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("Processing search query:", query);

    // Ask AI to extract structured search criteria from the natural-language query
    const systemPrompt = `You extract artist search criteria from natural language queries for a music platform.
The user query may be written in ANY language (English, Romanian, French, German, Italian, Spanish, Portuguese, Polish, Russian, etc.). You MUST understand the query regardless of language and translate the extracted values to the canonical English values listed below.

CANONICAL VALUES (always return these exact strings, never the localized version):
- specialization: one of "Singer", "Instrumentalist", "DJ", "Band". Map any localized term:
  * Singer = cantaret, cântăreț, solist, vocalist, chanteur, sänger, cantante, cantor, певец, etc.
  * Instrumentalist = instrumentist, musicien, musiker, musicista, músico, etc.
  * DJ = dj, disc jockey, deejay (any language)
  * Band = trupa, trupă, formatie, formație, groupe, gruppe, banda, grupo, etc.
- experience_level: one of "Beginner", "Intermediate", "Advanced".
- genre: return the canonical English genre name (Pop, Rock, Jazz, Classical, Electronic, Hip Hop, Folk, R&B, Country, Reggae, Blues, Metal, Manele, Bhangra, House, Techno, Latin, Salsa, Disco, Soul, Funk, Punk, etc.). Translate from any language: "rock" stays "Rock"; "musique classique"/"musica clasica" -> "Classical"; "jazz" stays "Jazz"; "muzica populara" -> "Folk"; etc.
- country: ALWAYS return ISO 3166-1 alpha-2 code (2 uppercase letters). Examples: Franta/France/Franța/Frankreich/Francia -> "FR"; Romania/România/Roumanie/Rumänien -> "RO"; Germania/Germany/Allemagne/Deutschland -> "DE"; Italia/Italy/Italie -> "IT"; Spania/Spain/España/Espagne -> "ES"; UK/Marea Britanie/Royaume-Uni -> "GB"; SUA/USA/Statele Unite/États-Unis -> "US"; Olanda/Netherlands/Pays-Bas -> "NL"; etc.
- county: county, region, state, or city name as written by the user (any language is fine; do not translate place names).
- instrument: canonical English instrument name (Guitar, Piano, Drums, Violin, Saxophone, Bass, Trumpet, Flute, etc.). Translate: chitara/guitare/gitarre -> "Guitar"; pian/piano -> "Piano"; vioara/violon/geige -> "Violin"; tobe/batterie/schlagzeug -> "Drums"; etc.
- name: artist or stage name mentioned (keep as-is, do not translate proper names).
- keywords: any other free-text keywords (event type, vibe) translated to English.
- event_date: if the user mentions a specific date for an event/booking (e.g. "23 iunie 2026", "on June 23rd", "le 5 mai"), return it as ISO format YYYY-MM-DD. Otherwise null.
- event_end_date: if the user mentions a date range, the end date in YYYY-MM-DD. Otherwise null.
- is_artist_search: true ONLY when the user is clearly trying to find, search, book, hire, or filter musicians/artists/DJs/bands/singers/instrumentalists for the platform. Return false for greetings, small talk, personal questions, random questions, or anything not related to finding artists.

Use null for unspecified fields. Do NOT put generic chit-chat or random questions into keywords. Always extract what the user explicitly mentions, regardless of the query language.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_search_criteria",
              description: "Extract artist search criteria from the query.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: ["string", "null"], description: "Artist name or stage name keyword" },
                  specialization: { type: ["string", "null"], enum: ["Singer", "Instrumentalist", "DJ", "Band", null] },
                  genre: { type: ["string", "null"], description: "Music genre keyword" },
                  country: { type: ["string", "null"], description: "ISO 3166-1 alpha-2 country code (2 uppercase letters), e.g. FR, RO, DE" },
                  county: { type: ["string", "null"], description: "County, region, or city" },
                  experience_level: { type: ["string", "null"], enum: ["Beginner", "Intermediate", "Advanced", null] },
                  instrument: { type: ["string", "null"] },
                  keywords: { type: ["string", "null"], description: "Other free-text keywords (e.g. event type, vibe) for fuzzy bio match" },
                  event_date: { type: ["string", "null"], description: "Event date in YYYY-MM-DD format if user mentions one" },
                  event_end_date: { type: ["string", "null"], description: "End of event date range in YYYY-MM-DD format" },
                  is_artist_search: { type: "boolean", description: "Whether the query is clearly about finding/searching/booking artists on the platform" },
                },
                required: ["name", "specialization", "genre", "country", "county", "experience_level", "instrument", "keywords", "event_date", "event_end_date", "is_artist_search"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_search_criteria" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    type SearchCriteria = {
      name: string | null;
      specialization: string | null;
      genre: string | null;
      country: string | null;
      county: string | null;
      experience_level: string | null;
      instrument: string | null;
      keywords: string | null;
      event_date: string | null;
      event_end_date: string | null;
      is_artist_search: boolean | null;
    };

    let criteria: SearchCriteria = {
      name: null, specialization: null, genre: null, country: null,
      county: null, experience_level: null, instrument: null, keywords: null,
      event_date: null, event_end_date: null, is_artist_search: null,
    };
    try {
      if (toolCall?.function?.arguments) {
        criteria = { ...criteria, ...JSON.parse(toolCall.function.arguments) };
      }
    } catch (e) {
      console.error("Failed to parse criteria", e);
    }
    console.log("Extracted criteria:", criteria);

    // If no meaningful criteria were extracted, the query is not a valid artist search
    const hasAnyCriteria = !!(
      criteria.name ||
      criteria.specialization ||
      criteria.genre ||
      criteria.country ||
      criteria.county ||
      criteria.experience_level ||
      criteria.instrument ||
      criteria.keywords ||
      criteria.event_date
    );

    if (criteria.is_artist_search !== true || !hasAnyCriteria) {
      console.log("Not an artist search or no criteria extracted — returning empty results");
      return new Response(
        JSON.stringify({
          response: "I couldn't understand your search. Try describing what kind of artist you're looking for (e.g. genre, location, instrument, or event date).",
          artists: [],
          criteria,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get artist user IDs (no FK relationship between profiles and user_roles)
    const { data: roleRows, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_type", "artist");
    if (rolesError) console.error("Roles error:", rolesError);
    let artistIds = (roleRows || []).map((r: any) => r.user_id);

    // If user specified an event date, exclude artists who are busy on that date.
    // Busy = has a 'blocked' calendar_events entry OR an 'accepted' booking_request on that date (or overlapping range).
    if (criteria.event_date && artistIds.length > 0) {
      const startDate = criteria.event_date;
      const endDate = criteria.event_end_date || criteria.event_date;

      const [{ data: busyCal }, { data: busyBookings }] = await Promise.all([
        supabase
          .from("calendar_events")
          .select("profile_id")
          .eq("status", "blocked")
          .gte("event_date", startDate)
          .lte("event_date", endDate)
          .in("profile_id", artistIds),
        supabase
          .from("booking_requests")
          .select("profile_id, event_date, event_end_date")
          .eq("status", "accepted")
          .in("profile_id", artistIds),
      ]);

      const busyIds = new Set<string>();
      (busyCal || []).forEach((r: any) => busyIds.add(r.profile_id));
      (busyBookings || []).forEach((r: any) => {
        const bStart = r.event_date;
        const bEnd = r.event_end_date || r.event_date;
        // Overlap check: bStart <= endDate AND bEnd >= startDate
        if (bStart <= endDate && bEnd >= startDate) {
          busyIds.add(r.profile_id);
        }
      });

      const before = artistIds.length;
      artistIds = artistIds.filter((id: string) => !busyIds.has(id));
      console.log(`Date filter ${startDate}..${endDate}: excluded ${before - artistIds.length} busy artist(s)`);
    }

    // Helper to run a query against the artist subset
    const baseSelect = "id, stage_name, first_name, last_name, avatar_url, specialization, music_genres, country, county, experience_level, instruments, bio, plan";

    let q = supabase
      .from("profiles")
      .select(baseSelect)
      .in("id", artistIds.length > 0 ? artistIds : ["00000000-0000-0000-0000-000000000000"])
      .limit(24);

    if (criteria.specialization) q = q.eq("specialization", criteria.specialization);
    if (criteria.experience_level) q = q.eq("experience_level", criteria.experience_level);
    if (criteria.country) {
      // country is stored as ISO code (e.g. "FR") in DB; AI returns ISO code, but accept names too
      const c = criteria.country.trim();
      q = q.or(`country.ilike.${c},country.ilike.%${c}%`);
    }
    if (criteria.county) q = q.ilike("county", `%${criteria.county}%`);
    if (criteria.genre) q = q.ilike("music_genres", `%${criteria.genre}%`);
    if (criteria.instrument) q = q.ilike("instruments", `%${criteria.instrument}%`);

    if (criteria.name) {
      const n = criteria.name;
      q = q.or(
        `stage_name.ilike.%${n}%,first_name.ilike.%${n}%,last_name.ilike.%${n}%`
      );
    }

    let { data: artists, error: dbError } = await q;
    if (dbError) {
      console.error("DB error:", dbError);
      artists = [];
    }

    // Fallback: only run a broader OR search when NO hard criteria were extracted.
    // Hard criteria (specialization, genre, location, instrument, experience) must be respected strictly.
    const hasHardCriteria = !!(
      criteria.specialization ||
      criteria.genre ||
      criteria.county ||
      criteria.country ||
      criteria.instrument ||
      criteria.experience_level
    );

    if ((!artists || artists.length === 0) && artistIds.length > 0 && !hasHardCriteria) {
      const orParts: string[] = [];
      const terms = [criteria.name, criteria.keywords]
        .filter((t): t is string => !!t);
      for (const t of terms) {
        orParts.push(
          `stage_name.ilike.%${t}%`,
          `first_name.ilike.%${t}%`,
          `last_name.ilike.%${t}%`,
          `bio.ilike.%${t}%`,
        );
      }
      if (orParts.length > 0) {
        const { data: fallback, error: fbError } = await supabase
          .from("profiles")
          .select(baseSelect)
          .in("id", artistIds)
          .or(orParts.join(","))
          .limit(24);
        if (fbError) console.error("Fallback error:", fbError);
        artists = fallback || [];
      }
    }

    const results = (artists || []).map((a: any) => ({
      id: a.id,
      stage_name: a.stage_name,
      first_name: a.first_name,
      last_name: a.last_name,
      avatar_url: a.avatar_url,
      specialization: a.specialization,
      music_genres: a.music_genres,
      country: a.country,
      county: a.county,
      experience_level: a.experience_level,
      plan: a.plan,
    }));

    let summary = "";
    if (results.length === 0) {
      summary = "No matching artists found. Try different keywords, a genre, location, or artist name.";
    } else {
      summary = `Found ${results.length} matching artist${results.length === 1 ? "" : "s"}.`;
    }

    console.log(`Returning ${results.length} artists`);

    return new Response(
      JSON.stringify({ response: summary, artists: results, criteria }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-search function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
