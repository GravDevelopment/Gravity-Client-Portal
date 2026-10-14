// One card per course: a certificate and the training (enrolment) it was issued
// for are paired by enrolment ID. Course names can't be used — the certificate
// and enrolment tables name the same course differently almost every time.
// Either side may be missing: a learner still in training has no certificate
// yet, and about 5% of certificates carry no enrolment link.
export function mergeResults(certificates, trainings) {
  const byEnroll = new Map(trainings.map((t) => [t.enrollId, t]));
  const cards = certificates.map((certificate) => {
    const training = byEnroll.get(certificate.enrollId) ?? null;
    if (training) byEnroll.delete(certificate.enrollId);
    return { courseName: certificate.course, certificate, training };
  });
  for (const training of byEnroll.values()) {
    cards.push({ courseName: training.courseName, certificate: null, training });
  }
  return cards;
}

// Matches the reminder job's window (api/src/reminders.ts REMINDER_DAYS).
export const EXPIRING_DAYS = 90;

/** valid | expiring (within EXPIRING_DAYS) | expired | fraudulent, plus days left. */
export function certificateStatus(certificate, now = new Date()) {
  if (certificate.fraudulent) return { kind: 'fraudulent', daysLeft: null };
  const expiry = Date.parse(`${certificate.revalidationDate}T00:00:00Z`);
  if (Number.isNaN(expiry)) return { kind: 'valid', daysLeft: null };
  const today = Date.parse(`${now.toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })}T00:00:00Z`);
  const daysLeft = Math.round((expiry - today) / 86_400_000);
  if (daysLeft < 0) return { kind: 'expired', daysLeft };
  return { kind: daysLeft <= EXPIRING_DAYS ? 'expiring' : 'valid', daysLeft };
}
