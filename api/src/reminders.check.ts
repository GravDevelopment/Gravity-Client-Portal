// Self-check for which certificates get a reminder, and the email. Run: npm run check
import { strict as assert } from "assert";
import type { Certificate } from "./dataverse";
import { daysUntil, dueCertificates, reminderEmail, todaySA } from "./reminders";

const cert = (revalidationDate: string, extra: Partial<Certificate> = {}): Certificate => ({
  certificateId: `c-${revalidationDate}`,
  enrollId: null,
  idNumber: "X1",
  name: "Sam",
  surname: "B",
  course: "Basic Fall Arrest Technician",
  dateIssued: "2024-01-01",
  revalidationDate,
  fraudulent: false,
  ...extra,
});

const today = "2026-10-14";
assert.equal(daysUntil("2027-01-12", today), 90);
assert.equal(daysUntil("", today), null);

const due = dueCertificates(
  [
    cert("2027-01-12"), // exactly 90 days → due
    cert("2027-01-13"), // 91 days → not yet
    cert("2026-10-14"), // expires today → due
    cert("2026-10-13"), // already expired → no
    cert("2026-11-01", { fraudulent: true }), // fraudulent → never
    cert("2026-11-01", { certificateId: "" }), // nothing to record against → no
    cert(""), // no expiry date → no
  ],
  today
).map((c) => c.revalidationDate);
assert.deepEqual(due, ["2027-01-12", "2026-10-14"]);

const email = reminderEmail("sam@example.com", cert("2026-10-15", { course: "<Rope> & Rigging" }), today, "https://portal");
assert.equal(email.to, "sam@example.com");
assert.match(email.subject, /expires tomorrow/);
assert.match(email.html, /&lt;Rope&gt; &amp; Rigging/, "course names are escaped in the HTML");

assert.match(todaySA(new Date("2026-10-14T23:30:00Z")), /^2026-10-15$/, "uses South African date, not UTC");

console.log("reminder checks passed");
