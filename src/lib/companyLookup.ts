/**
 * Placeholder service for automatic company lookup by CIF/CUI.
 * Wire this up to a real provider (e.g. ANAF, OpenAPI.ro, VIES) when ready.
 *
 * Expected shape returned to the UI so it can auto-fill billing details.
 */
export interface CompanyLookupResult {
  name: string;
  cui: string;
  reg_com?: string;
  address?: string;
  city?: string;
  county?: string;
  country?: string;
  vat_payer?: boolean;
}

export async function verifyCompanyByCui(
  _cui: string,
): Promise<{ ok: boolean; data?: CompanyLookupResult; error?: string }> {
  // TODO: integrate with ANAF / VIES / partner provider.
  return {
    ok: false,
    error: "Company verification will be available soon.",
  };
}
