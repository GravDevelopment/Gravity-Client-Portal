import type { Certificate } from "./dataverse";

// A certificate gets one reminder, once it is within this many days of expiry.
export const REMINDER_DAYS = 90;

/** Today's date (YYYY-MM-DD) in South Africa, where the certificates are issued. */
export function todaySA(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
}

export function daysUntil(date: string, today: string): number | null {
  const target = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(target)) return null;
  return Math.round((target - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

/**
 * Certificates due a reminder: expiring within REMINDER_DAYS, not yet expired,
 * not flagged fraudulent. A client who links an ID with a certificate already
 * inside the window gets that reminder on the next daily run.
 */
export function dueCertificates(certificates: Certificate[], today: string): Certificate[] {
  return certificates.filter((c) => {
    if (c.fraudulent || !c.certificateId) return false;
    const days = daysUntil(c.revalidationDate, today);
    return days !== null && days >= 0 && days <= REMINDER_DAYS;
  });
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

export interface ReminderEmail {
  to: string;
  subject: string;
  html: string;
}

export function reminderEmail(to: string, cert: Certificate, today: string, portalUrl: string): ReminderEmail {
  const days = daysUntil(cert.revalidationDate, today) ?? 0;
  const name = cert.name ? escape(cert.name) : "there";
  const course = escape(cert.course || "your Gravity Training");
  const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  return {
    to,
    subject: `Your ${cert.course || "Gravity Training"} certificate expires ${when}`,
    html: `<p>Hi ${name},</p>
<p>Your <strong>${course}</strong> certificate expires on <strong>${escape(cert.revalidationDate)}</strong> (${when}).</p>
<p>To stay certified, please book your recertification with us before then — reply to this email or call +27 12 349 1318.</p>
<p>You can see all your certificates and manuals at <a href="${escape(portalUrl)}">${escape(portalUrl)}</a>.</p>
<p>Gravity Training</p>
<p style="color:#666;font-size:12px">You are getting this because reminders are switched on in your Gravity client portal profile. You can switch them off there.</p>`,
  };
}
