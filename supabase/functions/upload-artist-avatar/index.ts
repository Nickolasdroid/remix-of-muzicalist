import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { user_id, email, image_base64, content_type } = body ?? {};

    if (!user_id || !email || !image_base64) {
      return new Response(
        JSON.stringify({ error: "Missing user_id, email or image_base64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ct = (content_type ?? "image/jpeg").toLowerCase();
    if (!["image/jpeg", "image/png", "image/jpg"].includes(ct)) {
      return new Response(JSON.stringify({ error: "Unsupported content type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user exists, email matches, and was created recently (anti-abuse).
    const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(user_id);
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const u = userRes.user;
    if ((u.email ?? "").toLowerCase() !== String(email).toLowerCase()) {
      return new Response(JSON.stringify({ error: "Email mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const createdAt = new Date(u.created_at ?? 0).getTime();
    if (Date.now() - createdAt > 10 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Signup window expired" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = base64ToBytes(image_base64);
    if (bytes.byteLength > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Image too large (max 5MB)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ext = ct === "image/png" ? "png" : "jpg";
    const path = `${user_id}/avatar.${ext}`;

    const { error: upErr } = await admin.storage
      .from("avatars")
      .upload(path, bytes, { contentType: ct, upsert: true });
    if (upErr) {
      return new Response(JSON.stringify({ error: `Upload failed: ${upErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error: updErr } = await admin
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user_id);
    if (updErr) {
      return new Response(JSON.stringify({ error: `Profile update failed: ${updErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ avatar_url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
