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
Specializations available: Singer, Instrumentalist, DJ, Band.
Experience levels: Beginner, Intermediate, Advanced.
Common genres: Pop, Rock, Jazz, Classical, Electronic, Hip Hop, Folk, R&B, Country, Reggae, Blues, Metal.
Locations can be any country or county/region.
Extract whatever the user explicitly mentions. Use null for unspecified fields. The 'name' field captures any artist or stage name mentioned.`;

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
                  country: { type: ["string", "null"] },
                  county: { type: ["string", "null"], description: "County, region, or city" },
                  experience_level: { type: ["string", "null"], enum: ["Beginner", "Intermediate", "Advanced", null] },
                  instrument: { type: ["string", "null"] },
                  keywords: { type: ["string", "null"], description: "Other free-text keywords (e.g. event type, vibe) for fuzzy bio match" },
                },
                required: ["name", "specialization", "genre", "country", "county", "experience_level", "instrument", "keywords"],
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
    let criteria: Record<string, string | null> = {
      name: null, specialization: null, genre: null, country: null,
      county: null, experience_level: null, instrument: null, keywords: null,
    };
    try {
      if (toolCall?.function?.arguments) {
        criteria = { ...criteria, ...JSON.parse(toolCall.function.arguments) };
      }
    } catch (e) {
      console.error("Failed to parse criteria", e);
    }
    console.log("Extracted criteria:", criteria);

    // Get artist user IDs (no FK relationship between profiles and user_roles)
    const { data: roleRows, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_type", "artist");
    if (rolesError) console.error("Roles error:", rolesError);
    const artistIds = (roleRows || []).map((r: any) => r.user_id);

    // Helper to run a query against the artist subset
    const baseSelect = "id, stage_name, first_name, last_name, avatar_url, specialization, music_genres, country, county, experience_level, instruments, bio, plan";

    let q = supabase
      .from("profiles")
      .select(baseSelect)
      .in("id", artistIds.length > 0 ? artistIds : ["00000000-0000-0000-0000-000000000000"])
      .limit(24);

    if (criteria.specialization) q = q.eq("specialization", criteria.specialization);
    if (criteria.experience_level) q = q.eq("experience_level", criteria.experience_level);
    if (criteria.country) q = q.ilike("country", `%${criteria.country}%`);
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

    // Fallback: broader OR search across all extracted terms if strict AND match returned nothing
    if ((!artists || artists.length === 0) && artistIds.length > 0) {
      const orParts: string[] = [];
      const terms = [criteria.name, criteria.keywords, criteria.genre, criteria.county, criteria.country, criteria.instrument]
        .filter((t): t is string => !!t);
      for (const t of terms) {
        orParts.push(
          `stage_name.ilike.%${t}%`,
          `first_name.ilike.%${t}%`,
          `last_name.ilike.%${t}%`,
          `bio.ilike.%${t}%`,
          `music_genres.ilike.%${t}%`,
          `county.ilike.%${t}%`,
          `country.ilike.%${t}%`,
          `instruments.ilike.%${t}%`,
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
