// Business identification data Legea 365/2002 requires on the site, plus the SAL entity
// Legea 140/2017 requires naming (see ROADMAP.md Phase 0 and Section 11.2). Kept out of the
// footer component and out of every locale file for the same reason contact-info.ts is
// separate: this is business data, not a translation, and it changes independently of
// copy or wording.
//
// TODO(branding): none of this exists yet. Per ROADMAP.md Section 3, the legal form is not
// even chosen or registered, so there is no registered name, registration number or CUI to
// put here, and the SAL entity is an explicit open decision (ROADMAP.md line 75). Replace
// every field below with the owner's real data before launch; do not guess at a SAL entity
// name, several are accredited in Romania and picking one is a business decision, not this
// codebase's to make.
const LEGAL_INFO = {
  registeredName: 'gn33 [legal form pending]',
  registrationNumber: 'Pending',
  cui: 'Pending',
  registeredOffice: 'Pending',
  // Stable, real, and the same for every Romanian merchant, unlike the fields above - this is
  // not placeholder data.
  anpcUrl: 'https://anpc.ro',
  salEntity: null as string | null,
} as const;

export default LEGAL_INFO;
