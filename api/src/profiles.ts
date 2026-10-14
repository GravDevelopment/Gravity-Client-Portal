import { TableClient } from "@azure/data-tables";

// Client profiles and sent-reminder records live in Azure Table Storage, in the
// Function App's own storage account (AzureWebJobsStorage — the timer trigger
// needs that account anyway). Locally that is Azurite: `npm run storage`.

export interface Profile {
  userId: string; // Entra object ID of the signed-in client
  idNumber: string;
  email: string;
  remindersEnabled: boolean;
  linkedAt: string;
}

const PARTITION = "profile";

function table(name: string): TableClient {
  const connection = process.env.AzureWebJobsStorage;
  if (!connection) throw new Error("Missing AzureWebJobsStorage");
  return TableClient.fromConnectionString(connection, name, {
    allowInsecureConnection: connection.includes("UseDevelopmentStorage") || connection.includes("127.0.0.1"),
  });
}

const created = new Set<string>();
async function ready(name: string): Promise<TableClient> {
  const client = table(name);
  if (!created.has(name)) {
    await client.createTable(); // no-op if it exists
    created.add(name);
  }
  return client;
}

function toProfile(e: Record<string, unknown>): Profile {
  return {
    userId: String(e.rowKey),
    idNumber: String(e.idNumber ?? ""),
    email: String(e.email ?? ""),
    remindersEnabled: e.remindersEnabled === true,
    linkedAt: String(e.linkedAt ?? ""),
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    return toProfile(await (await ready("profiles")).getEntity(PARTITION, userId));
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode === 404) return null;
    throw err;
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  const { userId, ...fields } = profile;
  await (await ready("profiles")).upsertEntity({ partitionKey: PARTITION, rowKey: userId, ...fields }, "Replace");
}

export async function deleteProfile(userId: string): Promise<void> {
  try {
    await (await ready("profiles")).deleteEntity(PARTITION, userId);
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode !== 404) throw err;
  }
}

// ponytail: full scan of the profiles table, fine into the tens of thousands of
// clients; add a "reminders on" partition if the daily run gets slow.
export async function listReminderProfiles(): Promise<Profile[]> {
  const out: Profile[] = [];
  const client = await ready("profiles");
  for await (const e of client.listEntities({ queryOptions: { filter: `PartitionKey eq '${PARTITION}'` } })) {
    const profile = toProfile(e);
    if (profile.remindersEnabled && profile.email) out.push(profile);
  }
  return out;
}

// One row per (certificate, client) once its 90-day reminder has gone out, so
// it is never sent twice — even if the client unlinks and links again.
export async function reminderSent(certificateId: string, userId: string): Promise<boolean> {
  try {
    await (await ready("reminders")).getEntity(certificateId, userId);
    return true;
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode === 404) return false;
    throw err;
  }
}

export async function recordReminder(certificateId: string, userId: string, email: string): Promise<void> {
  await (await ready("reminders")).upsertEntity(
    { partitionKey: certificateId, rowKey: userId, email, sentAt: new Date().toISOString() },
    "Replace"
  );
}
