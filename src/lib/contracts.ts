// Booking contracts: types, labels and the printable contract document.
// Contracts are generated server-side (respond_to_booking_offer) as a frozen snapshot;
// this file only renders them. Template "v1" — Romanian, reviewed text should replace it
// once a lawyer has checked the clauses.

import { MUZICALIST_LOGO_DATA_URI } from "@/lib/contractLogo";

export type EntityType = "individual" | "pfa" | "ii" | "if" | "srl" | "other_company";

export interface ContractDetails {
  entity_type: EntityType;
  legal_name: string;
  cui?: string | null;
  reg_com?: string | null;
  address?: string | null;
  city?: string | null;
  county?: string | null;
  country?: string | null;
  representative?: string | null;
  vat_payer?: boolean;
  iban?: string | null;
  bank?: string | null;
}

export interface ContractParty extends Partial<ContractDetails> {
  stage_name?: string | null;
  email?: string | null;
  phone?: string | null;
  /** false when the party had not filled in contract details (fallback from the profile) */
  complete?: boolean;
}

export interface ContractTerms {
  price: number | string;
  currency: string;
  offer_note?: string | null;
  event_date: string;
  event_end_date?: string | null;
  event_type?: string | null;
  time?: string | null;
  location?: string | null;
}

export interface BookingContract {
  id: string;
  booking_request_id: string;
  contract_number: string;
  template_version: string;
  artist_party: ContractParty;
  organizer_party: ContractParty;
  terms: ContractTerms;
  artist_accepted_at: string;
  organizer_accepted_at: string;
  created_at: string;
}

export const CONTRACT_COLUMNS =
  "id, booking_request_id, contract_number, template_version, artist_party, organizer_party, terms, artist_accepted_at, organizer_accepted_at, created_at";

/** English labels (translated by the RO dictionary in the UI). */
export const ENTITY_TYPE_OPTIONS: { value: EntityType; label: string }[] = [
  { value: "individual", label: "Individual (no company)" },
  { value: "pfa", label: "PFA (authorized individual)" },
  { value: "ii", label: "II (individual enterprise)" },
  { value: "if", label: "IF (family enterprise)" },
  { value: "srl", label: "SRL (limited company)" },
  { value: "other_company", label: "Other company type" },
];

export const isCompany = (t?: string | null) => !!t && t !== "individual";

const ENTITY_SHORT_RO: Record<EntityType, string> = {
  individual: "persoană fizică",
  pfa: "PFA",
  ii: "întreprindere individuală",
  if: "întreprindere familială",
  srl: "SRL",
  other_company: "persoană juridică",
};

const BLANK = "________________";
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const v = (s?: string | null) => (s && String(s).trim() ? esc(String(s).trim()) : BLANK);

const joinAddress = (p: ContractParty) =>
  [p.address, p.city, p.county ? `jud. ${p.county}` : null, p.country].filter((x) => x && String(x).trim()).join(", ");

const roDate = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
};
const roDayOf = (iso: string) =>
  new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Bucharest" });
const roDateTime = (iso: string) =>
  new Date(iso).toLocaleString("ro-RO", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Bucharest" });

export const formatContractPrice = (price: number | string, currency: string) => {
  const n = Number(price);
  if (!Number.isFinite(n)) return `${price} ${currency}`;
  try {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency,
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n} ${currency}`;
  }
};

/** One paragraph identifying a party, as it appears in the contract. */
export const describeParty = (p: ContractParty, role: "Prestator" | "Beneficiar") => {
  const type = (p.entity_type || "individual") as EntityType;
  const address = joinAddress(p);
  const contact = [p.phone ? `tel. ${esc(p.phone)}` : null, p.email ? `e-mail ${esc(p.email)}` : null]
    .filter(Boolean)
    .join(", ");
  const bank = p.iban ? `, cont IBAN ${esc(p.iban)}${p.bank ? ` deschis la ${esc(p.bank)}` : ""}` : "";
  const stage = p.stage_name && p.stage_name !== p.legal_name ? `, cunoscut(ă) sub numele de scenă „${esc(p.stage_name)}”` : "";

  // Skip the form label when the name already contains it (e.g. "Pop Andrei PFA")
  const formLabel = (p.legal_name || "").toUpperCase().includes(ENTITY_SHORT_RO[type].toUpperCase())
    ? ""
    : `, ${ENTITY_SHORT_RO[type]}`;
  let text: string;
  if (type === "individual") {
    text = `<b>${v(p.legal_name)}</b>, persoană fizică, cu domiciliul în ${address ? esc(address) : BLANK}${stage}`;
  } else if (type === "srl" || type === "other_company") {
    text =
      `<b>${v(p.legal_name)}</b>${formLabel}, cu sediul în ${address ? esc(address) : BLANK}, ` +
      `înregistrată la Registrul Comerțului sub nr. ${v(p.reg_com)}, CUI ${v(p.cui)}${bank}, ` +
      `reprezentată legal prin ${v(p.representative)}${stage}`;
  } else {
    text =
      `<b>${v(p.legal_name)}</b>${formLabel}, cu sediul profesional în ${address ? esc(address) : BLANK}, ` +
      `înregistrat(ă) la Registrul Comerțului sub nr. ${v(p.reg_com)}, CUI ${v(p.cui)}${bank}${stage}`;
  }
  return `${text}${contact ? ` (${contact})` : ""}, în calitate de <b>${role}</b>`;
};

/** Full HTML document for a contract (Romanian, template v1). */
export const renderContractHtml = (c: BookingContract, opts: { preview?: boolean } = {}) => {
  const t = c.terms;
  const a = c.artist_party;
  const o = c.organizer_party;
  const when = (iso: string) => (opts.preview ? "la acceptarea ofertei" : roDateTime(iso));
  const multiDay = t.event_end_date && t.event_end_date !== t.event_date;
  const dateText = multiDay ? `${roDate(t.event_date)} – ${roDate(t.event_end_date!)}` : roDate(t.event_date);
  const price = formatContractPrice(t.price, t.currency);
  const vatLine = isCompany(a.entity_type)
    ? a.vat_payer
      ? "Prestatorul declară că este înregistrat în scopuri de TVA."
      : "Prestatorul declară că nu este înregistrat în scopuri de TVA."
    : "";
  const payTo = a.iban ? `în contul Prestatorului indicat la art. 1` : `prin modalitatea convenită de părți (numerar sau transfer bancar)`;

  const clauses: [string, string[]][] = [
    ["Art. 1. Părțile contractante", [`1.1. ${describeParty(a, "Prestator")};`, `1.2. ${describeParty(o, "Beneficiar")}.`]],
    [
      "Art. 2. Obiectul contractului",
      [
        `2.1. Prestatorul se obligă să susțină un program artistic${t.event_type ? ` pentru evenimentul de tip <b>${esc(t.event_type)}</b>` : ""} organizat de Beneficiar, la data de <b>${esc(dateText)}</b>${t.time ? `, în intervalul orar <b>${esc(t.time)}</b>` : ""}, în locația <b>${v(t.location)}</b>.`,
        ...(t.offer_note ? [`2.2. Detaliile prestației, conform ofertei acceptate: ${esc(t.offer_note)}`] : []),
      ],
    ],
    [
      "Art. 3. Prețul și modalitatea de plată",
      [
        `3.1. Prețul total agreat pentru prestația de la art. 2 este de <b>${esc(price)}</b>.${vatLine ? ` ${vatLine}` : ""}`,
        `3.2. Plata se face direct de către Beneficiar Prestatorului, ${payTo}, cel târziu la data evenimentului, dacă părțile nu convin altfel în scris.`,
        "3.3. Platforma Muzicalist nu încasează și nu intermediază plata prețului.",
      ],
    ],
    [
      "Art. 4. Obligațiile Prestatorului",
      [
        "4.1. Să se prezinte la locația și ora stabilite, cu timp suficient pentru pregătire.",
        "4.2. Să susțină programul artistic convenit, cu profesionalism și pe toată durata stabilită.",
        "4.3. Să asigure echipamentul inclus în ofertă și să anunțe Beneficiarul de îndată despre orice impediment.",
      ],
    ],
    [
      "Art. 5. Obligațiile Beneficiarului",
      [
        "5.1. Să plătească prețul în condițiile art. 3.",
        "5.2. Să asigure accesul Prestatorului în locație, spațiul necesar, alimentarea cu energie electrică și condiții de siguranță adecvate.",
        "5.3. Să anunțe Prestatorul de îndată despre orice modificare privind data, ora sau locația evenimentului.",
      ],
    ],
    [
      "Art. 6. Modificarea și încetarea contractului",
      [
        "6.1. Orice modificare a prezentului contract se face numai cu acordul scris al ambelor părți, inclusiv prin mesaje transmise prin platforma Muzicalist.",
        "6.2. Partea care dorește anularea prestației o comunică celeilalte părți în scris, cât mai curând posibil. Consecințele financiare ale anulării se stabilesc de comun acord, iar în lipsa unui acord, potrivit legii.",
      ],
    ],
    [
      "Art. 7. Forța majoră",
      [
        "7.1. Niciuna dintre părți nu răspunde pentru neexecutarea obligațiilor cauzată de forța majoră, în condițiile legii, cu condiția notificării celeilalte părți în cel mai scurt timp.",
      ],
    ],
    [
      "Art. 8. Rolul platformei Muzicalist",
      [
        "8.1. Muzicalist este exclusiv intermediarul tehnic prin care părțile s-au întâlnit și au încheiat contractul. Muzicalist nu este parte a contractului și nu răspunde pentru executarea acestuia.",
      ],
    ],
    [
      "Art. 9. Legea aplicabilă și litigii",
      [
        "9.1. Contractul este guvernat de legea română. Eventualele neînțelegeri se soluționează pe cale amiabilă, iar în caz contrar de instanțele competente din România.",
      ],
    ],
    [
      "Art. 10. Încheierea contractului",
      [
        `10.1. Contractul s-a încheiat prin mijloace electronice, pe platforma Muzicalist: Prestatorul și-a exprimat acordul la trimiterea ofertei${opts.preview ? "" : ` (${esc(when(c.artist_accepted_at))})`}, iar Beneficiarul la acceptarea ofertei${opts.preview ? "" : ` (${esc(when(c.organizer_accepted_at))})`}, prin bifarea acordului cu termenii contractului.`,
        "10.2. Fiecare parte poate descărca un exemplar al contractului din contul său Muzicalist.",
      ],
    ],
  ];

  const incomplete = a.complete === false || o.complete === false;
  const header = opts.preview
    ? "Nr. se alocă la acceptarea ofertei"
    : `Nr. ${esc(c.contract_number)} din ${esc(roDayOf(c.organizer_accepted_at))}`;

  return `<!doctype html><html lang="ro"><head><meta charset="utf-8">
<title>${opts.preview ? "Contract (previzualizare)" : `Contract ${esc(c.contract_number)}`}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Georgia,"Times New Roman",serif;color:#1d1b26;margin:0 auto;padding:40px;max-width:780px;line-height:1.55;font-size:14.5px}
  .brand{display:flex;align-items:center;gap:10px;font-family:Inter,Arial,sans-serif;font-weight:700;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#9a6c08}
  .brand img{width:40px;height:40px;object-fit:contain}
  h1{font-size:22px;text-align:center;margin:18px 0 4px;letter-spacing:.02em}
  .no{text-align:center;color:#5c5a66;font-family:Inter,Arial,sans-serif;font-size:13px;margin-bottom:24px}
  h2{font-size:15px;margin:20px 0 6px}
  p{margin:0 0 6px;text-align:justify}
  .warn{font-family:Inter,Arial,sans-serif;font-size:12.5px;background:#fff7e6;border:1px solid #f1d39a;border-radius:8px;padding:10px 12px;margin-bottom:18px}
  .sign{display:flex;gap:24px;margin-top:32px}
  .sign div{flex:1;border-top:1px solid #1d1b26;padding-top:8px;font-size:13px}
  .foot{margin-top:28px;font-family:Inter,Arial,sans-serif;font-size:11.5px;color:#5c5a66}
  button{font-family:Inter,Arial,sans-serif;margin-top:20px;padding:10px 18px;border:0;border-radius:8px;background:#9a6c08;color:#fff;font-size:14px;cursor:pointer}
  @media print{button,.warn{display:none} body{padding:0}}
</style></head><body>
<div class="brand"><img src="${MUZICALIST_LOGO_DATA_URI}" alt="Muzicalist"><span>Muzicalist</span></div>
<h1>CONTRACT DE PRESTĂRI SERVICII ARTISTICE</h1>
<div class="no">${header}</div>
${opts.preview ? `<div class="warn"><b>Previzualizare.</b> Numărul contractului, datele complete de identificare ale părților și momentele acceptării se completează automat la acceptarea ofertei.</div>` : ""}
${!opts.preview && incomplete ? `<div class="warn">Unele date de identificare nu au fost completate în cont. Spațiile libere (${BLANK}) pot fi completate de mână pe exemplarul printat.</div>` : ""}
${clauses
  .map(([h, ps]) => `<h2>${esc(h)}</h2>${ps.map((p) => `<p>${p}</p>`).join("")}`)
  .join("\n")}
<div class="sign">
  <div><b>Prestator</b><br>${v(a.legal_name)}<br>Acceptat electronic ${opts.preview ? "la trimiterea ofertei" : `la ${esc(roDateTime(c.artist_accepted_at))}`}</div>
  <div><b>Beneficiar</b><br>${v(o.legal_name)}<br>Acceptat electronic ${opts.preview ? "la acceptarea ofertei" : `la ${esc(roDateTime(c.organizer_accepted_at))}`}</div>
</div>
<p class="foot">Document generat de platforma Muzicalist (model ${esc(c.template_version)})${opts.preview ? "" : `. Cod de verificare: ${esc(c.id)}`}</p>
<button onclick="window.print()">Printează / salvează PDF</button>
</body></html>`;
};

export const openContractWindow = (c: BookingContract, opts: { preview?: boolean } = {}) => {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(renderContractHtml(c, opts));
  w.document.close();
  return true;
};
