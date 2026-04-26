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

    const getCountryVariants = (country: string | null) => {
      if (!country) return [];
      const c = country.trim();
      const byCode: Record<string, string[]> = {
        RO: ["RO", "Romania", "România", "Roumanie", "Rumania"],
        GB: ["GB", "UK", "United Kingdom", "Marea Britanie", "Great Britain"],
        US: ["US", "USA", "United States", "Statele Unite"],
      };
      return Array.from(new Set([c, ...(byCode[c.toUpperCase()] || [])]));
    };

    const matchesCountry = (value: string | null | undefined, variants: string[]) => {
      if (!value) return false;
      const normalized = value.toLowerCase();
      return variants.some((v) => {
        const needle = v.toLowerCase();
        return normalized === needle || normalized.includes(needle) || needle.includes(normalized);
      });
    };

    // Ask AI to extract structured search criteria from the natural-language query
    const systemPrompt = `You extract artist search criteria from natural language queries for a music platform.
The user query may be written in ANY language (English, Romanian, French, German, Italian, Spanish, Portuguese, Polish, Russian, etc.). You MUST understand the query regardless of language and translate the extracted values to the canonical English values listed below.

CANONICAL VALUES (always return these exact strings, never the localized version):
- specialization: one of "Singer", "Instrumentalist", "DJ", "Band", or null. ONLY set this when the user EXPLICITLY names a specific specialization. Map localized terms:
  * Singer = cantaret, cântăreț, solist, vocalist, chanteur, sänger, cantante, cantor, певец, etc.
  * Instrumentalist = instrumentist, musicien, musiker, musicista, músico, etc.
  * DJ = dj, disc jockey, deejay (any language)
  * Band = trupa, trupă, formatie, formație, groupe, gruppe, banda, grupo, etc.
  * CRITICAL: Generic words like "artist", "artists", "artiști", "artisti", "musicians", "muzicieni", "performers", "interpreți", "cineva" are NOT specializations — they are umbrella terms covering ALL specializations. When the user uses these generic words, set specialization to null so results include singers, bands, DJs, and instrumentalists alike. Example: "Ce artisti canta manele?" -> specialization: null, genre: "Manele".
- experience_level: one of "Beginner", "Intermediate", "Advanced", "Professional", or null. The platform stores experience as a strict 4-level enum. ONLY set when the user EXPLICITLY references the artist's experience level / seniority / career stage. Map localized terms:
  * Beginner = incepator, începător, debutant, novice, junior, "la inceput de drum", "fara experienta", anfänger, principiante, débutant, новичок, etc.
  * Intermediate = intermediar, mediu, "cu ceva experienta", intermédiaire, intermedio, mittel, средний, etc.
  * Advanced = avansat, experimentat, "cu multa experienta", senior, veteran, "vechi in domeniu", expérimenté, esperto, erfahren, опытный, etc.
  * Professional = profesionist, profesionisti, profesională, professional, professionals, professionnel, professionnels, profesional, profesionales, pro, "de profesie", profi, профессионал, etc.
  * IMPORTANT: "Professional" IS a valid stored level — map "profesionist"/"professional"/"pro" to experience_level: "Professional", NOT to quality_filter. Quality words like "bun"/"good"/"top"/"best"/"slab"/"bad"/"renumit"/"celebru"/"de calitate" are reputation judgments that go into quality_filter. Keep these two dimensions strictly separate.
- genre: return the canonical English genre name (Pop, Rock, Jazz, Classical, Electronic, Hip Hop, Folk, R&B, Country, Reggae, Blues, Metal, Manele, Bhangra, House, Techno, Latin, Salsa, Disco, Soul, Funk, Punk, etc.). Translate from any language: "rock" stays "Rock"; "musique classique"/"musica clasica" -> "Classical"; "jazz" stays "Jazz"; "muzica populara" -> "Folk"; etc.
- country: ALWAYS return ISO 3166-1 alpha-2 code (2 uppercase letters) ONLY for INCLUDED locations. Examples: Franta/France/Franța/Frankreich/Francia -> "FR"; Romania/România/Roumanie/Rumänien -> "RO"; Germania/Germany/Allemagne/Deutschland -> "DE"; Italia/Italy/Italie -> "IT"; Spania/Spain/España/Espagne -> "ES"; UK/Marea Britanie/Royaume-Uni -> "GB"; SUA/USA/Statele Unite/États-Unis -> "US"; Olanda/Netherlands/Pays-Bas -> "NL"; etc.
- excluded_country: ALWAYS return ISO 3166-1 alpha-2 code (2 uppercase letters) for NEGATED locations. Romanian examples: "să nu fie din România", "nu din Romania", "care nu este din România", "exceptând România" -> excluded_country: "RO" and country: null. English examples: "not from France", "outside Germany", "except Italy" -> excluded_country set, country null.
- county: county, region, state, or city name as written by the user (any language is fine; do not translate place names).
- instrument: pick the BEST MATCH from the EXACT canonical instrument list available on the platform (written exactly as listed):
  Strings: "Acoustic Guitar", "Electric Guitar", "Bass Guitar", "Classical Guitar", "Violin", "Viola", "Cello", "Double Bass", "Harp", "Ukulele", "Banjo", "Mandolin", "Balalaika", "Sitar", "Oud"
  Keyboard: "Piano", "Keyboard", "Synthesizer", "Organ", "Accordion", "Harpsichord", "Electric Piano"
  Woodwind: "Flute", "Clarinet", "Saxophone", "Oboe", "Bassoon", "Recorder", "Piccolo", "Pan Flute", "Harmonica"
  Brass: "Trumpet", "Trombone", "French Horn", "Tuba", "Cornet", "Euphonium", "Flugelhorn"
  Percussion: "Drums", "Percussion", "Cajon", "Congas", "Bongos", "Djembe", "Timpani", "Marimba", "Xylophone", "Vibraphone", "Tambourine", "Triangle"
  Electronic: "Drum Machine", "Sampler", "MIDI Controller"
  Traditional/Folk: "Bagpipes", "Didgeridoo", "Tabla", "Nai", "Cimbalom", "Cobza", "Țambal"
  Translation/synonym examples: chitara/chitară/guitare/gitarre -> "Guitar" (generic, will match all guitar variants); chitara electrica/electric guitar -> "Electric Guitar"; chitara bas/bass -> "Bass Guitar"; pian/piano -> "Piano"; vioara/violon/geige -> "Violin"; violoncel/cello -> "Cello"; tobe/batterie/schlagzeug -> "Drums"; sax -> "Saxophone"; acordeon/accordéon -> "Accordion"; nai/pan flute -> "Pan Flute"; țambal/cimbalom -> "Cimbalom"; muzicuta/harmonica -> "Harmonica".
  IMPORTANT: When the user says a generic family name without a qualifier (e.g. just "guitar"/"chitară"), return the SHORTEST canonical keyword that the DB ilike substring match will broaden across all variants — e.g. "Guitar" matches Acoustic/Electric/Classical/Bass Guitar; "Bass" matches Bass Guitar/Double Bass. When the user is specific (e.g. "chitară clasică"), return the exact canonical name ("Classical Guitar").
- name: artist or stage name mentioned (keep as-is, do not translate proper names).
- keywords: any other free-text keywords (event type, vibe) translated to English. Do NOT put negation/location words like "not from", "nu din", "să nu fie din" into keywords; use excluded_country instead.
- event_date: if the user mentions a specific date for an event/booking (e.g. "23 iunie 2026", "on June 23rd", "le 5 mai"), return it as ISO format YYYY-MM-DD. Otherwise null.
- event_end_date: if the user mentions a date range, the end date in YYYY-MM-DD. Otherwise null.
- budget_amount: numeric value (number, no currency symbols) when the user mentions a budget, price, or how much they want to spend. Examples: "buget 2000 lei" -> 2000; "around 500 euro" -> 500; "pana in 1500 ron" -> 1500; "between 1000 and 2000" -> use the upper bound 2000; "max 800" -> 800. Otherwise null.
- budget_currency: ISO-like currency code derived from the user's wording: "RON"/"LEI" -> "RON"; "EUR"/"euro"/"€" -> "EUR"; "USD"/"dollar"/"$" -> "USD"; "GBP"/"pound"/"£" -> "GBP". Default to "RON" when budget_amount is set but no currency is mentioned. Otherwise null.
- event_type: short canonical English event type when the user mentions one (e.g. "wedding", "baptism", "corporate", "birthday", "party", "festival", "club", "concert", "private event", "anniversary", "graduation"). Translate from any language: "nunta"/"nuntă" -> "wedding"; "botez" -> "baptism"; "cununie" -> "wedding"; "petrecere"/"petrecere privata" -> "private party"; "aniversare" -> "anniversary"; "majorat" -> "birthday"; "corporativ" -> "corporate". Otherwise null.
- quality_filter: one of "high", "low", or null. Set when the user expresses a quality judgment about the artist:
  * "high" -> user wants GOOD/TOP/BEST/QUALITY artists based on REPUTATION/REVIEWS. Examples: "un instrumentist bun", "cei mai buni soliști", "top DJs", "good band", "best singers", "buni", "talentati", "de calitate", "renumiti", "celebri", "experimentati", "cu recenzii bune". Do NOT trigger this on the word "profesionist"/"professional"/"pro" — those map to experience_level instead.
  * "low" -> user explicitly wants WEAK/BAD/CHEAP/BEGINNER artists. Examples: "un solist slab", "artisti slabi", "incepatori", "ieftini", "mediocri", "bad singers".
  * null -> no quality judgment expressed.
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
                  excluded_country: { type: ["string", "null"], description: "ISO 3166-1 alpha-2 country code that must be excluded when the user says not from/outside/except a country" },
                  county: { type: ["string", "null"], description: "County, region, or city" },
                  experience_level: { type: ["string", "null"], enum: ["Beginner", "Intermediate", "Advanced", "Professional", null] },
                  instrument: { type: ["string", "null"] },
                  keywords: { type: ["string", "null"], description: "Other free-text keywords (e.g. event type, vibe) for fuzzy bio match" },
                  event_date: { type: ["string", "null"], description: "Event date in YYYY-MM-DD format if user mentions one" },
                  event_end_date: { type: ["string", "null"], description: "End of event date range in YYYY-MM-DD format" },
                  quality_filter: { type: ["string", "null"], enum: ["high", "low", null], description: "Quality judgment: 'high' for good/top artists, 'low' for weak/bad artists, null otherwise" },
                  budget_amount: { type: ["number", "null"], description: "Numeric budget the user mentioned (no currency symbols)" },
                  budget_currency: { type: ["string", "null"], description: "Currency code: RON, EUR, USD, GBP" },
                  event_type: { type: ["string", "null"], description: "Canonical English event type (wedding, baptism, corporate, birthday, etc.)" },
                  is_artist_search: { type: "boolean", description: "Whether the query is clearly about finding/searching/booking artists on the platform" },
                },
                required: ["name", "specialization", "genre", "country", "excluded_country", "county", "experience_level", "instrument", "keywords", "event_date", "event_end_date", "quality_filter", "budget_amount", "budget_currency", "event_type", "is_artist_search"],
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
      excluded_country: string | null;
      county: string | null;
      experience_level: string | null;
      instrument: string | null;
      keywords: string | null;
      event_date: string | null;
      event_end_date: string | null;
      quality_filter: "high" | "low" | null;
      budget_amount: number | null;
      budget_currency: string | null;
      event_type: string | null;
      is_artist_search: boolean | null;
    };

    let criteria: SearchCriteria = {
      name: null, specialization: null, genre: null, country: null, excluded_country: null,
      county: null, experience_level: null, instrument: null, keywords: null,
      event_date: null, event_end_date: null, quality_filter: null,
      budget_amount: null, budget_currency: null, event_type: null, is_artist_search: null,
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
      criteria.excluded_country ||
      criteria.county ||
      criteria.experience_level ||
      criteria.instrument ||
      criteria.keywords ||
      criteria.event_date ||
      criteria.quality_filter ||
      criteria.budget_amount ||
      criteria.event_type
    );

    // Helper: translate a fallback English message into the user's language
    async function localizeMessage(englishMessage: string): Promise<string> {
      try {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `Detect the language of the user query and rewrite the given English message in that exact language. Keep the meaning, tone, and length identical. Return ONLY the rewritten message, no quotes, no explanations. If you cannot detect the language reliably, return the English message unchanged.`,
              },
              { role: "user", content: `User query: ${query}\n\nMessage to translate:\n${englishMessage}` },
            ],
          }),
        });
        if (resp.ok) {
          const d = await resp.json();
          const t = d.choices?.[0]?.message?.content?.trim();
          if (t && t.length > 0 && t.length < 600) return t;
        }
      } catch (e) {
        console.error("localizeMessage failed (non-fatal):", e);
      }
      return englishMessage;
    }

    if (criteria.is_artist_search !== true || !hasAnyCriteria) {
      console.log("Not an artist search or no criteria extracted — returning empty results");
      const msg = await localizeMessage(
        "I couldn't understand your search. Try describing what kind of artist you're looking for (e.g. genre, location, instrument, or event date)."
      );
      return new Response(
        JSON.stringify({
          response: msg,
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

    const hasHardCriteria = !!(
      criteria.specialization ||
      criteria.genre ||
      criteria.county ||
      criteria.country ||
      criteria.excluded_country ||
      criteria.instrument ||
      criteria.experience_level
    );

    // Helper to run a query against the artist subset
    const baseSelect = "id, stage_name, first_name, last_name, avatar_url, specialization, music_genres, country, county, experience_level, instruments, bio, plan, estimated_price";

    let q = supabase
      .from("profiles")
      .select(baseSelect)
      .in("id", artistIds.length > 0 ? artistIds : ["00000000-0000-0000-0000-000000000000"])
      .limit(24);

    if (criteria.specialization) q = q.eq("specialization", criteria.specialization);
    if (criteria.experience_level) q = q.eq("experience_level", criteria.experience_level);
    if (criteria.country) {
      // country is stored as ISO code (e.g. "FR") in DB; AI returns ISO code, but accept names too
      q = q.in("country", getCountryVariants(criteria.country));
    }
    if (criteria.county) q = q.ilike("county", `%${criteria.county}%`);
    if (criteria.genre) q = q.ilike("music_genres", `%${criteria.genre}%`);
    if (criteria.instrument) {
      // Use the LAST word of the canonical instrument as a flexible substring match
      // so "Acoustic Guitar" / "Electric Guitar" / "Bass Guitar" / "Classical Guitar" all match "Guitar".
      // This keeps the search robust to instrument changes/removals in artist profiles.
      const raw = criteria.instrument.trim();
      const parts = raw.split(/\s+/);
      const root = parts[parts.length - 1]; // "Acoustic Guitar" -> "Guitar"; "Piano" -> "Piano"
      q = q.ilike("instruments", `%${root}%`);
    }

    if (criteria.name) {
      const n = criteria.name;
      q = q.or(
        `stage_name.ilike.%${n}%,first_name.ilike.%${n}%,last_name.ilike.%${n}%`
      );
    }

    if (criteria.keywords && !hasHardCriteria && !criteria.name && !criteria.event_date) {
      const k = criteria.keywords;
      q = q.or(
        `stage_name.ilike.%${k}%,first_name.ilike.%${k}%,last_name.ilike.%${k}%,bio.ilike.%${k}%,music_genres.ilike.%${k}%,instruments.ilike.%${k}%`
      );
    }

    let { data: artists, error: dbError } = await q;
    if (dbError) {
      console.error("DB error:", dbError);
      artists = [];
    }

    if (criteria.excluded_country && artists) {
      const excludedVariants = getCountryVariants(criteria.excluded_country);
      artists = artists.filter((a: any) => !matchesCountry(a.country, excludedVariants));
    }

    // Fallback: only run a broader OR search when NO hard criteria were extracted.
    // Hard criteria (specialization, genre, location, instrument, experience) must be respected strictly.
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

    let enrichedArtists = artists || [];

    // Fetch reviews for the matched artists to compute quality metrics (avg rating + count)
    const ratingMap = new Map<string, { avg: number; count: number }>();
    if (enrichedArtists.length > 0) {
      const ids = enrichedArtists.map((a: any) => a.id);
      const { data: reviewRows, error: revError } = await supabase
        .from("reviews")
        .select("profile_id, rating")
        .in("profile_id", ids);
      if (revError) console.error("Reviews fetch error:", revError);
      const acc = new Map<string, { sum: number; count: number }>();
      for (const r of reviewRows || []) {
        const cur = acc.get(r.profile_id) || { sum: 0, count: 0 };
        cur.sum += Number(r.rating) || 0;
        cur.count += 1;
        acc.set(r.profile_id, cur);
      }
      for (const [pid, { sum, count }] of acc.entries()) {
        ratingMap.set(pid, { avg: count > 0 ? sum / count : 0, count });
      }
    }

    // Apply quality filter (high = good artists, low = weak artists)
    if (criteria.quality_filter === "high") {
      enrichedArtists = enrichedArtists.filter((a: any) => {
        const r = ratingMap.get(a.id);
        return r && r.count > 0 && r.avg >= 4;
      });
      // Sort best first
      enrichedArtists.sort((a: any, b: any) => {
        const ra = ratingMap.get(a.id) || { avg: 0, count: 0 };
        const rb = ratingMap.get(b.id) || { avg: 0, count: 0 };
        if (rb.avg !== ra.avg) return rb.avg - ra.avg;
        return rb.count - ra.count;
      });
    } else if (criteria.quality_filter === "low") {
      enrichedArtists = enrichedArtists.filter((a: any) => {
        const r = ratingMap.get(a.id);
        // "weak" = has reviews and avg below 3, OR has no reviews at all (unproven)
        return !r || r.avg < 3;
      });
      enrichedArtists.sort((a: any, b: any) => {
        const ra = ratingMap.get(a.id) || { avg: 0, count: 0 };
        const rb = ratingMap.get(b.id) || { avg: 0, count: 0 };
        return ra.avg - rb.avg;
      });
    }

    const results = enrichedArtists.map((a: any) => {
      const r = ratingMap.get(a.id) || { avg: 0, count: 0 };
      return {
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
        avg_rating: Number(r.avg.toFixed(2)),
        review_count: r.count,
      };
    });

    let summary = "";
    if (results.length === 0) {
      summary = await localizeMessage(
        "No matching artists found. Try different keywords, a genre, location, or artist name."
      );
    } else {
      // Build a breakdown by specialization to give the model factual data
      const breakdown: Record<string, number> = {};
      for (const a of results) {
        const spec = a.specialization || "Unspecified";
        breakdown[spec] = (breakdown[spec] || 0) + 1;
      }
      const breakdownStr = Object.entries(breakdown)
        .map(([spec, count]) => `${count} ${spec}`)
        .join(", ");

      // Default fallback summary
      summary = `Found ${results.length} matching artist${results.length === 1 ? "" : "s"} (${breakdownStr}).`;

      // Generate an elaborated conversational reply in the user's language.
      try {
        const elaborateResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are a helpful assistant for a music artist booking platform.

The user searched and we found ${results.length} artist(s). Breakdown by specialization: ${breakdownStr}.
Extracted search context (refer to its meaning, not field names):
${JSON.stringify({
  genre: criteria.genre,
  specialization: criteria.specialization,
  instrument: criteria.instrument,
  country: criteria.country,
  excluded_country: criteria.excluded_country,
  county: criteria.county,
  event_date: criteria.event_date,
  keywords: criteria.keywords,
  quality_filter: criteria.quality_filter,
}, null, 2)}
${criteria.quality_filter ? `\nNote: results were filtered/sorted by quality (${criteria.quality_filter === "high" ? "top-rated artists, avg rating >= 4 stars" : "lower-rated or unrated artists"}). Mention this naturally in the reply (e.g. "cei mai bine apreciați", "with the best reviews", "selected based on reviews").` : ""}

Your job: write a SHORT (1-2 sentences, max 280 characters) friendly reply in the SAME LANGUAGE as the user's query.

MUST:
- State the total count AND the breakdown by specialization (e.g. "2 artiști, dintre care 1 instrumentist și 1 solist").
- Translate specialization names naturally into the user's language. For Romanian use: Singer -> "solist" (NEVER "cântăreț"), Instrumentalist -> "instrumentist", Band -> "trupă", DJ -> "DJ". Use proper plurals (soliști, instrumentiști, trupe, DJ).
- Weave in the user's specific request naturally — if they asked about a genre (e.g. "manele"), location, instrument, occasion, or date, reference it in the reply (e.g. "...care cântă acest gen de muzică", "...din această zonă", "...disponibili la această dată").
- Make the sentence feel like a direct answer to THEIR question, not a generic summary.

Rules:
- Match the user's language exactly (Romanian -> Romanian, French -> French, English -> English, etc.).
- Use natural connector phrasing ("dintre care", "of which", "dont").
- Do NOT list artist names. Do NOT use markdown, emojis, or greetings.
- Return ONLY the reply text.`,
              },
              { role: "user", content: query },
            ],
          }),
        });

        if (elaborateResp.ok) {
          const elaborateData = await elaborateResp.json();
          const extra = elaborateData.choices?.[0]?.message?.content?.trim();
          if (extra && extra.length > 0 && extra.length < 500) {
            summary = extra;
          }
        }
      } catch (e) {
        console.error("Elaboration step failed (non-fatal):", e);
      }
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
