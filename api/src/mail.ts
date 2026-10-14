import { ConfidentialClientApplication } from "@azure/msal-node";
import type { ReminderEmail } from "./reminders";

// Reminders go out from the certification@ mailbox in the staff tenant, through
// Microsoft Graph, so replies land with the certification team. The app
// registration behind MAIL_CLIENT_ID holds Mail.Send, limited by an Exchange
// policy to that one mailbox (see README → Reminder emails).
//
// With MAIL_FROM / MAIL_CLIENT_ID / MAIL_CLIENT_SECRET unset, nothing is sent.

export function mailConfigured(): boolean {
  return Boolean(process.env.MAIL_FROM && process.env.MAIL_CLIENT_ID && process.env.MAIL_CLIENT_SECRET);
}

let client: ConfidentialClientApplication | null = null;

async function graphToken(): Promise<string> {
  const tenant = process.env.MAIL_TENANT_ID || process.env.TENANT_ID;
  if (!tenant) throw new Error("Missing MAIL_TENANT_ID (or TENANT_ID) for sending mail");
  client ??= new ConfidentialClientApplication({
    auth: {
      clientId: process.env.MAIL_CLIENT_ID!,
      authority: `https://login.microsoftonline.com/${tenant}`,
      clientSecret: process.env.MAIL_CLIENT_SECRET!,
    },
  });
  const result = await client.acquireTokenByClientCredential({ scopes: ["https://graph.microsoft.com/.default"] });
  if (!result?.accessToken) throw new Error("Failed to get a Microsoft Graph token for sending mail");
  return result.accessToken;
}

/** Sends one email from MAIL_FROM. Throws with Graph's reason if it is refused. */
export async function sendMail(email: ReminderEmail): Promise<void> {
  const from = process.env.MAIL_FROM!;
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await graphToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        subject: email.subject,
        body: { contentType: "HTML", content: email.html },
        toRecipients: [{ emailAddress: { address: email.to } }],
      },
      // Kept in the mailbox's Sent Items, so the team can see what went out.
      saveToSentItems: true,
    }),
  });
  if (!response.ok) {
    throw new Error(`Graph sendMail refused: ${response.status} ${(await response.text()).slice(0, 300)}`);
  }
}
