# Where these manuals came from

**Single source of truth: the SharePoint `Manuals` folder.**

> [Open it in SharePoint](https://gravitygh.sharepoint.com/sites/GravityGH/Gravity%20GH/Forms/AllItems.aspx?id=%2Fsites%2FGravityGH%2FGravity%20GH%2FGravity%20Data%2FGravity%20Training%2FB%20Training%2FDesign%20and%20Development%2FManuals)
>
> `gravitygh.sharepoint.com/sites/GravityGH` → Gravity GH → Gravity Data →
> Gravity Training → B Training → Design and Development → **Manuals**

Imported 2026-09-01. Every file the portal serves is in that folder, but not
every file in the folder is served (see *Not served* below). The older
`Gravity Internal Training Course Material` library is no longer used as a
source — the translations that only existed there were copied across.

**These files are still a snapshot, not a live feed.** Replacing a PDF in
SharePoint does not change the portal until someone repeats the refresh below.

"Doc code" is the revision string printed inside the PDF itself — the reliable
way to tell which revision a file really is, since filenames drift.

| Served as | SharePoint file | Doc code | Language | Bytes | sha256 (first 16) |
|---|---|---|---|---|---|
| `afr.pdf` | AFR & US 229999 Manual.pdf | GLC99LM Rev_3 | English | 11599061 | 1e5fa3661c72af7d |
| `bfa.pdf` | BFA & US 229998 Manual.pdf | GT98_LM_Rev 5.1 | English | 1119365 | a4a59350ed42f370 |
| `ceim.pdf` | CEIM Manual.pdf | GLCCEIMLM_Rev 4 | English | 1196645 | eaa3f006e5bda7f1 |
| `fabr-fr.pdf` | FABR & US 229998 & 229995 Manual (French).pdf | GLCFABRLM02_Rev 5.2 | Français | 6088329 | 4f90bbbf85a56b03 |
| `fabr.pdf` | FABR & US 229998 & 229995 Manual.pdf | GT9895_LM_Rev 6.1 | English | 7842980 | d57f1c04ea406361 |
| `fplu.pdf` | FPLU Manual.pdf | GTFPULM02_Rev 1 | English — unmapped | 2094570 | b9ac291a5fadbeca |
| `fpp.pdf` | FPP & US 229994 Manual.pdf | GT94_LM_Rev_5 | English | 6567640 | 3b57aab9afc7933b |
| `gls-fr.pdf` | GTGLS Manual (French).pdf | GLCGLSLM02_Rev 2.2 | Français | 3776638 | e86cb28f72e02149 |
| `gls.pdf` | GTGLS manual.pdf | GTGLS_LM_Rev 3 | English | 4542184 | fe2b14815f991e2d |
| `gvs.pdf` | GVS Manual.pdf | (none printed) — VERIFY | English | 1470233 | ea1dfb5c48f10684 |
| `ifpp-fr.pdf` | GLCIFPP Manual (French).pdf | GLCMLLM02_Rev 2 — code mismatch | Français | 3226384 | d26739d5046011f1 |
| `ifpp.pdf` | GLCIFPP Manual.pdf | GLCIFPPLM_Rev 3 | English | 1161781 | 96a7bfb29eb559ce |
| `mechanical-lifting-fr.pdf` | ML MANUAL (French).pdf | GLCMLLM_Rev 2.1 | Français | 7064520 | c222570f4ba6ed5d |
| `mechanical-lifting.pdf` | ML MANUAL.pdf | ML_M_Rev 2.1 | English | 4238150 | d7bdc243df79fb94 |
| `plpc.pdf` | GLCPLPC MANUAL.pdf | GLCPLPC_Rev 4 | English | 2565910 | 40279085d135091b |
| `plu.pdf` | PLU MANUAL.pdf | PLU_M_Rev3 | English | 2185047 | 5590f1dc209ede23 |
| `ra-l1.pdf` | GLC98&00LM - Learner Manual_Rev 3.pdf | GLC98&00LM_Rev 3 | English | 6056066 | 8742e4f4f31936cf |
| `ra-l2-l3.pdf` | GLC96,97&LM - Level 2 & 3 Manual_Rev 2.pdf | GLC96,97&LM_Rev 2 | English | 13201535 | 003f0760e46aedaa |
| `rfa-fr.pdf` | GTRFA Manual (French).pdf | GLCRFALM02_Rev 1.4 (DRC) | Français | 2438978 | 142ce03201178843 |
| `rfa.pdf` | GTRFA_LM_Rev 4.pdf | GTRFA_LM_Rev 4 | English | 883353 | 4b2a97cd880964ea |
| `rope-rigging-fr.pdf` | GLC06LM_RR MANUAL (French).pdf | GTRRLM02_Rev 3.2 | Français | 4787019 | 370ee77eea8c3de5 |
| `rope-rigging.pdf` | GLC06LM_RR MANUAL_Rev3.3 .pdf | GLC06M_Rev 3.3 | English | 5163143 | 1339a2bbd034eb86 |
| `telecommunication-abseiling.pdf` | GLCTALM01_Telecommmunication Abseiling Manual_Rev3.pdf | GLCTALM01_Rev 3 | English | 2159621 | 835a444a37bfbf13 |
| `tower-erector-fr.pdf` | GLCTELM_TOWER ERECTOR MANUAL (French).pdf | GLCTELM_Rev 2.1 | Français | 8319157 | 90a2f69b2b6fb3b4 |
| `tower-erector.pdf` | GLCTELM_TOWER ERECTOR MANUAL_Rev 3.pdf | GLCTELM_Rev 3 | English | 2264645 | 18af4b9e10d09c13 |

## Not served

These remain in the SharePoint folder but are deliberately not in the portal.
They were not deleted from SharePoint — if that is wanted, remove them there too,
then refresh `BASELINE.json` so the drift check stays clean.

- **`GTMML Manual.pdf`** — a 4-page assessor marking sheet (`GTMML_POE_Rev 1.1`,
  "Assessor to mark A for achieved or NYA"), not a learner manual. Because of
  this the four **Manual and Mechanical Lifting** courses (150kg/500kg, SA/Int)
  have no manual. A real MML learner manual needs to be added to the folder.
- **`GTTVT_LM_Rev 1.pdf`** (Tower Verticality Testing) — withdrawn 2026-09-02 on
  request. The "Tower Verticality Testing" course now shows no manual.
- **`GTLOF Manual.pdf`** (Line of Fire) — withdrawn 2026-09-02 on request. No
  Dataverse course referenced it anyway.
- **All Portuguese and Urdu manuals** — withdrawn 2026-09-02 on request:
  `GTRFA Manual (Portuguese).pdf`, `GTRFA Manual (Urdu).pdf`,
  `FABR & US 229998 & 229995 Manual (Portuguese).pdf` and
  `... (Urdu).pdf`. **French is now the only translation offered.** All four were
  uploaded to SharePoint by the import; delete them there if they shouldn't be
  kept.

## Flagged for a human check

- **`gvs.pdf`** — the only file with no revision code and no course-overview
  page. Reads as a product specification ("Scope and intent", "Design",
  "Fall clearance") rather than a course manual. Mapped to the two GVS Installer
  courses on the assumption that is intentional.
- **`ifpp-fr.pdf`** — titled "MISE EN ŒUVRE D'UN PLAN DE PROTECTION" (Implement a
  Fall Protection Plan, correct) but its footer reads `GLCMLLM02_Rev 2`, which is
  a Mechanical Lifting code. Wrong footer in Gravity's source document.
- **`tower-erector-fr.pdf`** — titled "MONTEUR DE PYLÔNES" (Tower Erector,
  correct) but the opening line says "Le cours de Levage Mécanique"
  (Mechanical Lifting). Wrong intro sentence in the source document.
- **`afr.pdf`** is mapped to the plain **Fall Arrest Rescue** courses as well as
  the Advanced ones, because no separate non-Advanced manual exists anywhere.
- **`rope-rigging.pdf`** (`Rev 3.3`) and **`mechanical-lifting.pdf`** (`Rev 2.1`)
  are *older* than the versions the old library held (`Rev 4` and `Rev 3`). The
  new folder was taken as authoritative, but this may have been accidental.

## Courses with no manual

Basic Slinging · Commercial Banner Flighting · Confined Space Entry · Confined
Space Rescue · First Aid Training · High Angle Level 1 · Legal
Liability · Manual and Mechanical Lifting (all four) · Rooftop Worker ·
Supervision Level 3 · Floorplan Inspection · Inspect Gear KITS ·
Tower Verticality Testing

No IRATA manual exists either, but the levelled IRATA courses now borrow the
Gravity rope access manuals — requested so a learner on an IRATA course can
still open the Gravity manual. See the IRATA block in `api/src/manuals.ts` for
which courses, and which are deliberately left out.

Learners on these see "Manual not available yet" and are pointed at
certification@gravitygh.co.za.

`fplu.pdf` (Fallprotec Securail) is imported but no Dataverse course name
matches it yet, so nothing links to it.

## Refreshing a manual

1. Replace the PDF in the SharePoint `Manuals` folder above.
2. Copy it into `api/manuals/` under the same served name from the table.
3. Check the doc code on an inside page and update the table (bytes +
   `sha256sum`).
4. Deploy: `cd api && func azure functionapp publish gravity-manuals-api`

No site rebuild is needed — the PDFs ship with the API, not the website.

## Adding a language

Name it `<served-name>-<iso639-1>.pdf` (e.g. `bfa-fr.pdf`) and add it to the
matching entry in [`../src/manuals.ts`](../src/manuals.ts). Language names shown
to learners come from `LANGUAGES` in that file.
