// Self-check for mapping a grav_validation row. Run: npm run check
import { strict as assert } from "assert";
import { mapCertificate, withHubCertificates, type Training } from "./dataverse";

const full = mapCertificate({
  grav_validationid: "cert-guid",
  _grav_enroll_value: "enroll-guid",
  grav_idnumber: "X1",
  grav_name: "A",
  grav_surname: "B",
  grav_course: "Basic Fall Arrest Technician",
  grav_dateissued: "2024-08-29",
  grav_revalidationdate: "2027-08-29T00:00:00Z",
  grav_fraudulent: true,
  grav_sqlid: "internal",
});
assert.equal(full.certificateId, "cert-guid", "keeps the certificate's own ID for reminders");
assert.equal(full.enrollId, "enroll-guid", "keeps the enrolment link for pairing");
assert.equal(full.revalidationDate, "2027-08-29", "dates are trimmed to the day");
assert.equal(full.fraudulent, true);
assert.equal((full as any).grav_sqlid, undefined, "nothing beyond the shown fields is passed on");

const empty = mapCertificate({});
assert.equal(empty.enrollId, null, "an unlinked certificate has no enrolment");
assert.equal(empty.fraudulent, false, "a missing flag is not fraudulent");
assert.equal(empty.dateIssued, "");

// The booking hub fills gaps in grav_validation.
const training = (enrollId: string, hub: Training["hubCertificate"]): Training => ({
  enrollId, firstName: "M", lastName: "O", courseName: "Rope Access Level 1", designation: "Rope Access Level 1 Basic Operative",
  startDate: null, endDate: null, status: "Competent", competent: true, hubCertificate: hub,
});
const linkedNoDate = { ...mapCertificate({ _grav_enroll_value: "e1", grav_dateissued: "2026-10-09" }) };
const unlinked = { ...mapCertificate({ grav_dateissued: "2023-10-25", grav_revalidationdate: "2026-10-25" }) };
const merged = withHubCertificates([linkedNoDate, unlinked], [
  training("e1", { number: "1/26", dateIssued: "2026-10-09", revalidationDate: "2029-10-09" }),
  training("e2", { number: "2/26", dateIssued: "2026-02-06", revalidationDate: "2029-02-06" }),
  training("e3", { number: "3/23", dateIssued: "2023-10-25", revalidationDate: "2026-10-25" }),
  training("e4", null),
]);
assert.equal(merged.length, 3, "one added for e2; e3 matched the unlinked copy; e4 has no certificate");
assert.equal(merged[0].revalidationDate, "2029-10-09", "a missing revalidation date comes from the hub");
assert.equal(merged[1].enrollId, "e3", "an unlinked copy issued the same day gets linked");
assert.deepEqual([merged[2].enrollId, merged[2].course, merged[2].revalidationDate], ["e2", "Rope Access Level 1 Basic Operative", "2029-02-06"]);
assert.equal(linkedNoDate.revalidationDate, "", "inputs are not mutated");

console.log("certificates checks passed");
