import { describe, expect, it } from "vitest";
import { describeParty, renderContractHtml, type BookingContract } from "../contracts";

const base: BookingContract = {
  id: "c0ffee00-0000-0000-0000-000000000000",
  booking_request_id: "b1",
  contract_number: "MZ-2026-000001",
  template_version: "v1",
  artist_party: {
    entity_type: "pfa",
    legal_name: "Pop Andrei PFA",
    cui: "RO12345678",
    reg_com: "F12/345/2020",
    address: "Str. Memorandumului 1",
    city: "Cluj-Napoca",
    county: "Cluj",
    country: "România",
    iban: "RO49AAAA1B31007593840000",
    stage_name: "DJ Andrei",
    complete: true,
  },
  organizer_party: { entity_type: "individual", legal_name: "Ion <Pop>", address: "Str. Florilor 5", city: "Turda", complete: true },
  terms: {
    price: "2500.00",
    currency: "RON",
    offer_note: "4 ore, sonorizare inclusă",
    event_date: "2026-11-14",
    event_end_date: null,
    event_type: "Wedding",
    time: "18:00 - 23:00",
    location: "Sala Regal, Cluj",
  },
  artist_accepted_at: "2026-10-22T16:00:00Z",
  organizer_accepted_at: "2026-10-22T17:30:00Z",
  created_at: "2026-10-22T17:30:00Z",
};

describe("contracts", () => {
  it("describes a PFA with trade register, CUI and IBAN", () => {
    const t = describeParty(base.artist_party, "Prestator");
    expect(t).toContain("Pop Andrei PFA");
    expect(t).not.toContain("Pop Andrei PFA</b>, PFA");
    expect(t).toContain("F12/345/2020");
    expect(t).toContain("RO12345678");
    expect(t).toContain("IBAN RO49AAAA1B31007593840000");
    expect(t).toContain("numele de scenă „DJ Andrei”");
    expect(t).toContain("Prestator");
  });

  it("describes an SRL with its legal representative and blanks for missing data", () => {
    const t = describeParty({ entity_type: "srl", legal_name: "Events SRL" }, "Beneficiar");
    expect(t).toContain("reprezentată legal prin ________________");
    expect(t).toContain("CUI ________________");
    expect(t).toContain("Events SRL</b>, cu sediul");
  });

  it("renders the full contract, escaped, with price, date, location and both acceptances", () => {
    const html = renderContractHtml(base);
    expect(html).toContain("CONTRACT DE PRESTĂRI SERVICII ARTISTICE");
    expect(html).toContain("Nr. MZ-2026-000001");
    expect(html).toContain("Ion &lt;Pop&gt;");
    expect(html).not.toContain("Ion <Pop>");
    expect(html).toContain("Sala Regal, Cluj");
    expect(html).toContain("evenimentul de tip <b>Nuntă</b>");
    expect(html).toContain("18:00 - 23:00");
    expect(html).toMatch(/2\.500\s*RON|2500\s*RON/);
    expect(html).toContain("14 noiembrie 2026");
    expect(html).toContain("nu este înregistrat în scopuri de TVA");
    expect(html).toContain("Muzicalist nu este parte a contractului");
    expect(html).toContain("Cod de verificare: c0ffee00");
    expect(html).not.toContain("Previzualizare");
  });

  it("warns about missing details and supports a preview without timestamps", () => {
    const incomplete = renderContractHtml({ ...base, artist_party: { legal_name: "Andrei Pop", complete: false } });
    expect(incomplete).toContain("pot fi completate de mână");
    const preview = renderContractHtml(base, { preview: true });
    expect(preview).toContain("Previzualizare");
    expect(preview).toContain("Nr. se alocă la acceptarea ofertei");
    expect(preview).not.toContain("Cod de verificare");
    expect(preview).not.toContain("MZ-2026-000001");
  });
});
