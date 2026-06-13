Add the legal entity operating Muzicalist to both the Privacy Policy and Terms of Service pages so users can identify the company behind the platform.

## Details to insert
- Company name: **FUTURE CRAFT SRL**
- CUI: **54307625**
- Location: Sat Sohodol, Comuna Sohodol
- Address: Str. Principală, Nr. 39

## Proposed changes

### 1. Privacy Policy (`src/pages/PrivacyPolicy.tsx`)
- Insert a new section **"Company Information / Data Controller"** near the top (after the introductory paragraph or before section 1). 
- Include: company name, CUI, registered address, and email contact.
- Rationale: GDPR Art. 13/14 requires the data controller's identity and contact details.

### 2. Terms of Service (`src/pages/TermsOfService.tsx`)
- Expand the existing **"Contact"** section (currently section 16) to also list the operator's legal identity: company name, CUI, and address, in addition to the email.
- Optional: add a short **"Operator Identity"** paragraph at the top of the document (e.g., "Muzicalist is operated by...") so users immediately know who they are contracting with.

Both edits are static text updates only — no new components, no logic changes, no dependencies.