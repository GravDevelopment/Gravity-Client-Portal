// Self-check for mapping a grav_validation row. Run: npm run check
import { strict as assert } from "assert";
import { mapCertificate } from "./dataverse";

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

console.log("certificates checks passed");
