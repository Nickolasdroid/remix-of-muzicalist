// AES-GCM encryption helper for transiently storing artist signup passwords
// between Stripe Checkout and the webhook. The key is derived from the
// service-role key (server-only) via HKDF-SHA256, so both edge functions
// agree on the key without needing an extra deployed secret.

const enc = new TextEncoder();
const dec = new TextDecoder();

async function getKey(): Promise<CryptoKey> {
  const baseSecret = Deno.env.get("PENDING_PASSWORD_KEY")
    ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!baseSecret) throw new Error("Missing key material for password encryption");

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(baseSecret),
    "HKDF",
    false,
    ["deriveKey"],
  );
  return await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: enc.encode("muzicalist:pending-artist-password:v1"),
      info: enc.encode("aes-gcm-256"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export async function encryptPassword(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext)),
  );
  const packed = new Uint8Array(iv.length + ct.length);
  packed.set(iv, 0);
  packed.set(ct, iv.length);
  return "v1:" + toBase64(packed);
}

export async function decryptPassword(payload: string): Promise<string> {
  if (!payload.startsWith("v1:")) throw new Error("Unsupported password payload");
  const packed = fromBase64(payload.slice(3));
  const iv = packed.slice(0, 12);
  const ct = packed.slice(12);
  const key = await getKey();
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return dec.decode(pt);
}
