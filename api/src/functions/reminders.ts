import { app, InvocationContext, Timer } from "@azure/functions";
import { searchCertificatesByIdNumber } from "../dataverse";
import { listReminderProfiles, recordReminder, reminderSent } from "../profiles";
import { mailConfigured, sendMail } from "../mail";
import { dueCertificates, reminderEmail, ReminderEmail, todaySA } from "../reminders";

// Until the mail settings are filled in, a run only logs who *would* be emailed
// and records nothing, so the first real run still sends every due reminder.
async function send(email: ReminderEmail, context: InvocationContext): Promise<boolean> {
  if (!mailConfigured()) {
    context.log(`[reminders] WOULD EMAIL ${email.to}: ${email.subject}`);
    return false;
  }
  await sendMail(email);
  context.log(`[reminders] emailed ${email.to}: ${email.subject}`);
  return true;
}

export async function runReminders(_timer: Timer | null, context: InvocationContext): Promise<void> {
  const today = todaySA();
  const portalUrl = process.env.PORTAL_URL || "https://gravity-portal";
  let due = 0;
  let sent = 0;

  for (const profile of await listReminderProfiles()) {
    try {
      // ponytail: one Dataverse query per client; batch IDs into one $filter if
      // the daily run gets slow with many thousands of profiles.
      const certificates = await searchCertificatesByIdNumber(profile.idNumber);
      for (const cert of dueCertificates(certificates, today)) {
        if (await reminderSent(cert.certificateId, profile.userId)) continue;
        due++;
        if (await send(reminderEmail(profile.email, cert, today, portalUrl), context)) {
          await recordReminder(cert.certificateId, profile.userId, profile.email);
          sent++;
        }
      }
    } catch (err) {
      // One client's failure must not stop everyone else's reminders.
      context.error(`[reminders] failed for profile ${profile.userId}`, err);
    }
  }
  context.log(`[reminders] ${today}: ${due} due, ${sent} sent`);
}

// 06:00 South African time (04:00 UTC), every day.
app.timer("reminders", {
  schedule: "0 0 4 * * *",
  handler: runReminders,
});
