// SmartBill invoice issuance helper.
// API docs: https://api.smartbill.ro/

const SMARTBILL_API_BASE = "https://ws.smartbill.ro/SBORO/api";

export interface StripeInvoiceLike {
  id?: string;
  amount_paid?: number; // cents
  currency?: string;
  number?: string;
  hosted_invoice_url?: string;
}

export interface ProfileBilling {
  id: string;
  email: string | null;
  stage_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  country?: string | null;
  county?: string | null;
  billing_entity_type?: string | null; // individual | company
  billing_name?: string | null;
  billing_cui?: string | null;
  billing_reg_com?: string | null;
  billing_address?: string | null;
  billing_city?: string | null;
  billing_county?: string | null;
  billing_country?: string | null;
  billing_vat_payer?: boolean | null;
  plan?: string | null;
  billing?: string | null; // monthly | yearly
}

export interface IssueResult {
  ok: boolean;
  series?: string;
  number?: string;
  url?: string;
  error?: string;
  raw?: unknown;
}

function basicAuth(username: string, token: string): string {
  return "Basic " + btoa(`${username}:${token}`);
}

export async function issueSmartBillInvoice(
  profile: ProfileBilling,
  stripeInvoice: StripeInvoiceLike,
): Promise<IssueResult> {
  const username = Deno.env.get("SMARTBILL_USERNAME");
  const token = Deno.env.get("SMARTBILL_API_TOKEN");
  const cif = Deno.env.get("SMARTBILL_CIF");
  const series = Deno.env.get("SMARTBILL_SERIES");
  const muzicalistIsVatPayer = (Deno.env.get("SMARTBILL_VAT_PAYER") ?? "false").toLowerCase() === "true";

  if (!username || !token || !cif || !series) {
    return { ok: false, error: "SmartBill credentials not fully configured" };
  }

  const amountCents = stripeInvoice.amount_paid ?? 0;
  const amount = Math.round(amountCents) / 100;
  const currency = (stripeInvoice.currency ?? "ron").toUpperCase();

  const isCompany = (profile.billing_entity_type ?? "individual") === "company";

  const clientName =
    profile.billing_name?.trim() ||
    (isCompany ? profile.stage_name ?? "" : `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()) ||
    profile.email ||
    "Client";

  const client: Record<string, unknown> = {
    name: clientName,
    email: profile.email ?? undefined,
    address: profile.billing_address ?? "",
    city: profile.billing_city ?? "",
    county: profile.billing_county ?? profile.county ?? "",
    country: profile.billing_country ?? profile.country ?? "Romania",
    saveToDb: true,
  };

  if (isCompany) {
    client.vatCode = profile.billing_cui ?? "";
    client.regCom = profile.billing_reg_com ?? "";
    client.isTaxPayer = !!profile.billing_vat_payer;
  } else {
    client.isTaxPayer = false;
  }

  const planLabel = profile.plan ?? "Standard";
  const billingLabel = profile.billing === "yearly" ? "anual" : "lunar";

  // VAT rules:
  // If Muzicalist is a VAT payer and the price is gross, set isTaxIncluded true and a 19% rate.
  // Otherwise no VAT.
  const products = [
    {
      name: `Abonament Muzicalist ${planLabel} (${billingLabel})`,
      code: `MUZ-${planLabel.toUpperCase()}-${billingLabel.toUpperCase()}`,
      isService: true,
      measuringUnitName: "buc",
      currency,
      quantity: 1,
      price: amount,
      isTaxIncluded: muzicalistIsVatPayer,
      taxName: muzicalistIsVatPayer ? "Normala" : "SDD",
      taxPercentage: muzicalistIsVatPayer ? 19 : 0,
      saveToDb: false,
    },
  ];

  const today = new Date().toISOString().slice(0, 10);

  const payload = {
    companyVatCode: cif,
    client,
    issueDate: today,
    seriesName: series,
    isDraft: false,
    dueDate: today,
    mentions: stripeInvoice.id ? `Stripe invoice: ${stripeInvoice.number ?? stripeInvoice.id}` : "",
    observations: "",
    products,
    sendEmail: !!profile.email,
    email: profile.email
      ? {
          to: profile.email,
          subject: "Factura ta Muzicalist",
          bodyText: "Îți mulțumim pentru abonamentul Muzicalist. Atașat găsești factura.",
        }
      : undefined,
  };

  try {
    const res = await fetch(`${SMARTBILL_API_BASE}/invoice`, {
      method: "POST",
      headers: {
        Authorization: basicAuth(username, token),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* not json */ }

    if (!res.ok || (json && json.errorText)) {
      return {
        ok: false,
        error: (json?.errorText || json?.message || text || `HTTP ${res.status}`).toString().slice(0, 500),
        raw: json ?? text,
      };
    }

    const returnedSeries = json?.series ?? series;
    const returnedNumber = (json?.number ?? "").toString();
    const url = returnedNumber
      ? `${SMARTBILL_API_BASE}/invoice/pdf?cif=${encodeURIComponent(cif)}&seriesname=${encodeURIComponent(returnedSeries)}&number=${encodeURIComponent(returnedNumber)}`
      : undefined;

    return { ok: true, series: returnedSeries, number: returnedNumber, url, raw: json };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
