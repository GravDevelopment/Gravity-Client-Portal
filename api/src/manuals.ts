// Which manual PDF belongs to which Dataverse course, and in which languages.
//
// Two maps rather than one, so the many course-name aliases (Int./Mines/Staff/
// Refresher/Bridging variants) don't each have to repeat their translations:
//
//   MANUALS       — manual key -> { language code: filename in api/manuals/ }
//   COURSE_MANUAL — grav_coursename (exact) -> manual key
//
// This lives on the API rather than the front-end because it is part of the
// access check: the browser never learns a filename it isn't entitled to.
//
// Primary source (imported 2026-09-01): the curated SharePoint folder
// "Design and Development / Manuals". Translations come from the older
// "Gravity Internal Training Course Material" library, which is the only place
// they exist. api/manuals/SOURCES.md records every file's origin and revision.

// Labels shown in the language dropdown.
export const LANGUAGES: Record<string, string> = {
  en: "English",
  fr: "French",
};

type LangFiles = Record<string, string>;

const MANUALS: Record<string, LangFiles> = {
  afr: { en: "afr.pdf" },                                    // GLC99LM Rev_3
  bfa: { en: "bfa.pdf" },                                    // GT98_LM_Rev 5.1
  ceim: { en: "ceim.pdf" },                                  // GLCCEIMLM_Rev 4
  fabr: {                                                    // GT9895_LM_Rev 6.1
    en: "fabr.pdf",
    fr: "fabr-fr.pdf",                                       // GLCFABRLM02_Rev 5.2
  },
  fplu: { en: "fplu.pdf" },                                  // GTFPULM02_Rev 1
  fpp: { en: "fpp.pdf" },                                    // GT94_LM_Rev_5
  gls: { en: "gls.pdf", fr: "gls-fr.pdf" },                  // GTGLS_LM_Rev 3 / GLCGLSLM02_Rev 2.2
  gvs: { en: "gvs.pdf" },                                    // VERIFY: product spec, no course-overview page
  ifpp: { en: "ifpp.pdf", fr: "ifpp-fr.pdf" },               // GLCIFPPLM_Rev 3
  mechanicalLifting: {                                       // ML_M_Rev 2.1
    en: "mechanical-lifting.pdf",
    fr: "mechanical-lifting-fr.pdf",                         // GLCMLLM_Rev 2.1
  },
  plpc: { en: "plpc.pdf" },                                  // GLCPLPC_Rev 4
  plu: { en: "plu.pdf" },                                    // PLU_M_Rev3
  raL1: { en: "ra-l1.pdf" },                                 // GLC98&00LM_Rev 3
  raL2L3: { en: "ra-l2-l3.pdf" },                            // GLC96,97&LM_Rev 2
  rfa: {                                                     // GTRFA_LM_Rev 4
    en: "rfa.pdf",
    fr: "rfa-fr.pdf",                                        // GLCRFALM02_Rev 1.4 (DRC)
  },
  ropeRigging: {                                             // GLC06M_Rev 3.3
    en: "rope-rigging.pdf",
    fr: "rope-rigging-fr.pdf",                               // GTRRLM02_Rev 3.2
  },
  telecomAbseiling: { en: "telecommunication-abseiling.pdf" }, // GLCTALM01_Rev 3
  towerErector: {                                            // GLCTELM_Rev 3
    en: "tower-erector.pdf",
    fr: "tower-erector-fr.pdf",                              // GLCTELM_Rev 2.1
  },
};

const COURSE_MANUAL: Record<string, keyof typeof MANUALS> = {
  // Advanced Fall Arrest Rescue
  "Advanced Fall Arrest Rescue (Int.)": "afr",
  "Advanced Fall Arrest Rescue Specialist": "afr",
  // VERIFY: the plain Fall Arrest Rescue courses are pointed at the *Advanced*
  // manual because no separate FAR manual exists in either SharePoint folder.
  "Fall Arrest Rescue": "afr",
  "Fall Arrest Rescue (Int.)": "afr",

  // Basic Fall Arrest
  "Basic Fall Arrest": "bfa",
  "Basic Fall Arrest (Int.)": "bfa",
  "Basic Fall Arrest (Mines)": "bfa",

  "Climbing Equipment Inspection and Management": "ceim",

  // Fall Arrest & Basic Rescue
  "Fall Arrest and Basic Rescue": "fabr",
  "Fall Arrest & Basic Rescue Technician (Int.)": "fabr",
  "Fall Arrest & Basic Rescue Technician (Int.) - Staff": "fabr",
  "Fall Arrest & Basic Rescue Refresher (Int.)": "fabr",
  "FABR Bridging Course": "fabr",
  "Fall Arrest Bridging Course": "fabr",

  // Fall Protection Plan
  "Fall Protection Plan Developer": "fpp",
  "Fall Protection Plan Development (Int.)": "fpp",
  "E-Learning Fall Protection Plan Developer": "fpp",
  "Implement a Fall Protection Plan": "ifpp",

  // Gravity lifeline systems
  "Gravity Horizontal System": "gls",
  "Gravity Vertical System": "gls",
  "Gravity Vertical System Installer": "gvs",
  "GVS Installer Refresher": "gvs",

  // Lifting
  "Mechanical Lifting": "mechanicalLifting",
  "Mechanical Lifting (Int.)": "mechanicalLifting",

  // Ladders
  "Portable Ladder and Pole Climbing": "plpc",
  "Portable Ladder User": "plu",
  "Portable Ladder User - Solar Structure": "plu",

  // Rope access
  "Rope Access Level 1": "raL1",
  "Rope Access L1 - Recap/Assessment only": "raL1",
  "Rope Access Level 2": "raL2L3",
  "Rope Access Level 2 Theory": "raL2L3",
  "Rope Access Level 2 Test": "raL2L3",
  "Rope Access L2 - Recap/Assessment only": "raL2L3",
  "Rope Access Level 3": "raL2L3",
  "Rope Access Level 3 Theory": "raL2L3",
  "Rope Access Level 3 Test": "raL2L3",
  "Rope Access L3 - Recap/Assessment only": "raL2L3",

  // IRATA. There is no IRATA manual anywhere — SOURCES.md lists IRATA under
  // "Courses with no manual" — so these share the Gravity rope access manuals,
  // which is what was asked for.
  "IRATA Rope Access Level 1": "raL1",
  "IRATA Rope Access Level 2": "raL2L3",
  "IRATA Rope Access Level 3": "raL2L3",
  //
  // Left unmapped, because their names don't say which level they are and the
  // L1 and L2/L3 manuals are different books: "IRATA Rope Access Theory" and
  // "IRATA Rope Access TEST", one competent learner each. "IRATA Assessor
  // Workshop Training" has none, and is assessor training rather than a
  // learner course.

  "Radio Frequency Awareness": "rfa",
  "E-Learning Radio Frequency Awareness": "rfa",

  // Rope rigging
  "Rope Rigging": "ropeRigging",
  "Rope Rigging (Int.)": "ropeRigging",
  "Rope Rigging (Int.) - Staff": "ropeRigging",
  "Rope Rigging Refresher (Int.)": "ropeRigging",
  "Rope Rigging Bridging Course": "ropeRigging",

  "Telecommunication Abseiling": "telecomAbseiling",
  "Tower Erector": "towerErector",
  "Assistant Tower Erector": "towerErector",

  // No course maps to fplu (Fallprotec Securail); the PDF is here ready for
  // when such a course exists in Dataverse.
  //
  // Deliberately unmapped: the four "Manual and Mechanical Lifting" courses.
  // The only MML file in SharePoint ("GTMML Manual.pdf") is a 4-page assessor
  // marking sheet (GTMML_POE_Rev 1.1), not a learner manual.
};

export interface ManualVariant {
  lang: string;
  label: string;
  file: string;
}

/** Every language a course's manual is available in; English first, or [] if none. */
export function manualsFor(courseName: string | null): ManualVariant[] {
  if (!courseName) return [];
  const key = COURSE_MANUAL[courseName];
  if (!key) return [];
  const files = MANUALS[key];
  if (!files) return [];
  return Object.keys(files)
    .sort((a, b) => (a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b)))
    .map((lang) => ({ lang, label: LANGUAGES[lang] ?? lang, file: files[lang] }));
}
