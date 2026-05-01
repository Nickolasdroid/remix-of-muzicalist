import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller using anon client + JWT
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service-role client to check admin role and perform deletion
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("user_type")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (roleErr || !roleRow || roleRow.user_type !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const targetId: string | undefined = body?.user_id;
    if (!targetId || typeof targetId !== "string") {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (targetId === userData.user.id) {
      return new Response(
        JSON.stringify({ error: "Admins cannot delete themselves" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Best-effort cleanup of public schema rows tied to the user.
    const tables = [
      "posts",
      "announcements",
      "announcement_likes",
      "post_likes",
      "calendar_events",
      "booking_requests",
      "consumed_ad_slots",
      "gallery_items",
      "pricing_entries",
      "reviews",
      "followers",
      "messages",
      "conversations",
      "notifications",
      "subscription_events",
      "user_roles",
      "profiles",
    ];

    // Delete profile-scoped rows
    await admin.from("posts").delete().eq("profile_id", targetId);
    await admin.from("announcements").delete().eq("profile_id", targetId);
    await admin.from("calendar_events").delete().eq("profile_id", targetId);
    await admin.from("booking_requests").delete().eq("profile_id", targetId);
    await admin.from("consumed_ad_slots").delete().eq("profile_id", targetId);
    await admin.from("gallery_items").delete().eq("profile_id", targetId);
    await admin.from("pricing_entries").delete().eq("profile_id", targetId);
    await admin.from("reviews").delete().eq("profile_id", targetId);
    await admin.from("subscription_events").delete().eq("profile_id", targetId);

    // User-id scoped rows
    await admin.from("announcement_likes").delete().eq("user_id", targetId);
    await admin.from("post_likes").delete().eq("user_id", targetId);
    await admin.from("notifications").delete().eq("user_id", targetId);
    await admin.from("followers").delete().eq("follower_id", targetId);
    await admin.from("followers").delete().eq("artist_id", targetId);
    await admin.from("messages").delete().eq("sender_id", targetId);
    await admin
      .from("conversations")
      .delete()
      .or(`artist_id.eq.${targetId},participant_id.eq.${targetId}`);
    await admin.from("user_roles").delete().eq("user_id", targetId);
    await admin.from("profiles").delete().eq("id", targetId);

    // Finally delete from auth
    const { error: delErr } = await admin.auth.admin.deleteUser(targetId);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, tables }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
