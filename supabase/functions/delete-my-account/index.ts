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

    const targetId = userData.user.id;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Best-effort cleanup of public schema rows tied to the user.
    await admin.from("posts").delete().eq("profile_id", targetId);
    await admin.from("announcements").delete().eq("profile_id", targetId);
    await admin.from("calendar_events").delete().eq("profile_id", targetId);
    await admin.from("booking_requests").delete().eq("profile_id", targetId);
    await admin.from("consumed_ad_slots").delete().eq("profile_id", targetId);
    await admin.from("gallery_items").delete().eq("profile_id", targetId);
    await admin.from("pricing_entries").delete().eq("profile_id", targetId);
    await admin.from("reviews").delete().eq("profile_id", targetId);
    await admin.from("subscription_events").delete().eq("profile_id", targetId);

    await admin.from("announcement_likes").delete().eq("user_id", targetId);
    await admin.from("post_likes").delete().eq("user_id", targetId);
    await admin.from("comment_likes").delete().eq("user_id", targetId);
    await admin.from("comments").delete().eq("user_id", targetId);
    await admin.from("notifications").delete().eq("user_id", targetId);
    await admin.from("followers").delete().eq("follower_id", targetId);
    await admin.from("followers").delete().eq("artist_id", targetId);
    await admin.from("messages").delete().eq("sender_id", targetId);
    await admin
      .from("conversations")
      .delete()
      .or(`artist_id.eq.${targetId},participant_id.eq.${targetId}`);
    await admin.from("content_reports").delete().eq("reporter_id", targetId);
    await admin.from("user_roles").delete().eq("user_id", targetId);
    await admin.from("profiles").delete().eq("id", targetId);

    // Delete from auth (this also invalidates all refresh tokens / sessions)
    const { error: delErr } = await admin.auth.admin.deleteUser(targetId);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
