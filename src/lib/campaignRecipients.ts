import * as XLSX from "xlsx";

export type RecipientError = "missing_email" | "invalid_format";

export interface Recipient {
  name: string;
  email: string;
}

export interface InvalidRecipient extends Recipient {
  error: RecipientError;
}

export interface ParsedRecipients {
  total: number;
  valid: Recipient[];
  invalid: InvalidRecipient[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_KEYS = ["name", "nume"];
const EMAIL_KEYS = ["email", "e-mail", "mail"];

const pick = (row: Record<string, unknown>, keys: string[]): string => {
  for (const k of Object.keys(row)) {
    if (keys.includes(k.trim().toLowerCase())) {
      const v = row[k];
      if (v == null) return "";
      return String(v).trim();
    }
  }
  return "";
};

export const errorLabel = (e: RecipientError): string =>
  e === "missing_email" ? "Missing email" : "Invalid email format";

export async function parseRecipientsFile(file: File): Promise<ParsedRecipients> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  const valid: Recipient[] = [];
  const invalid: InvalidRecipient[] = [];

  for (const row of rows) {
    const name = pick(row, NAME_KEYS);
    const email = pick(row, EMAIL_KEYS);

    if (!email) {
      if (!name && !email) continue; // skip fully empty rows
      invalid.push({ name, email, error: "missing_email" });
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      invalid.push({ name, email, error: "invalid_format" });
      continue;
    }
    valid.push({ name, email });
  }

  return { total: valid.length + invalid.length, valid, invalid };
}
