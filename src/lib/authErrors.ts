/**
 * True when the auth service rejected a password as weak or as appearing in a
 * known data breach (leaked password protection).
 */
export function isWeakPasswordError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  if (!e) return false;
  if (e.code === "weak_password") return true;
  const msg = (e.message || "").toLowerCase();
  return msg.includes("known to be weak") || msg.includes("pwned") || msg.includes("weak password");
}

export const LEAKED_PASSWORD_MESSAGE_EN =
  "This password has appeared in a data breach and isn't safe. Please choose a different password.";

export const LEAKED_PASSWORD_MESSAGE_RO =
  "Această parolă a apărut într-o scurgere de date și nu este sigură. Te rugăm să alegi altă parolă.";
