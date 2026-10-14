import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { signedInUser, Unauthorized } from "../auth";
import { searchCertificatesByIdNumber, searchTrainingsByLearnerId } from "../dataverse";
import { manualsFor } from "../manuals";
import { deleteProfile, getProfile, saveProfile } from "../profiles";
import { mintManualToken } from "../token";

// Same shapes the ID-number field accepts: letters, digits, "/" and "-".
const ID_NUMBER = /^[A-Z0-9/-]{4,40}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The signed-in client's own record. Everything is keyed by who is signed in —
// there is no way to ask for another ID number's certificates here.
export async function me(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  let userId: string;
  try {
    userId = await signedInUser(request);
  } catch (err) {
    if (err instanceof Unauthorized) {
      context.warn(`me: 401 — ${err.message}`);
      return { status: 401, jsonBody: { error: "Please sign in again." } };
    }
    throw err;
  }

  try {
    if (request.method === "PUT") return await link(userId, request);
    if (request.method === "DELETE") {
      await deleteProfile(userId);
      return { status: 204 };
    }
    return await read(userId, context);
  } catch (err) {
    context.error("me failed", err);
    return { status: 502, jsonBody: { error: "Something went wrong. Please try again." } };
  }
}

async function link(userId: string, request: HttpRequest): Promise<HttpResponseInit> {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const idNumber = String(body.idNumber ?? "").trim().toUpperCase();
  const email = String(body.email ?? "").trim();
  if (!ID_NUMBER.test(idNumber)) return { status: 400, jsonBody: { error: "Please enter a valid ID number." } };
  if (!EMAIL.test(email) || email.length > 254) return { status: 400, jsonBody: { error: "Please enter a valid email address." } };

  // ID number only, by decision — no proof the ID is theirs. Linking one with no
  // records at all is refused, since it is almost always a typo.
  const [certificates, trainings] = await Promise.all([
    searchCertificatesByIdNumber(idNumber),
    searchTrainingsByLearnerId(idNumber),
  ]);
  if (certificates.length === 0 && trainings.length === 0) {
    return { status: 404, jsonBody: { error: "We couldn't find any certificates or trainings for that ID number." } };
  }

  const existing = await getProfile(userId);
  await saveProfile({
    userId,
    idNumber,
    email,
    remindersEnabled: body.remindersEnabled !== false,
    linkedAt: existing?.idNumber === idNumber ? existing.linkedAt : new Date().toISOString(),
  });
  return { status: 204 };
}

async function read(userId: string, context: InvocationContext): Promise<HttpResponseInit> {
  const profile = await getProfile(userId);
  if (!profile) return { status: 200, jsonBody: { profile: null } };

  // Each lookup fails on its own, so a Dataverse hiccup on one still shows the other.
  const [certificates, trainings] = await Promise.allSettled([
    searchCertificatesByIdNumber(profile.idNumber),
    searchTrainingsByLearnerId(profile.idNumber),
  ]);
  if (certificates.status === "rejected") context.error("certificates lookup failed", certificates.reason);
  if (trainings.status === "rejected") context.error("trainings lookup failed", trainings.reason);

  return {
    status: 200,
    jsonBody: {
      profile,
      certificates: certificates.status === "fulfilled" ? certificates.value : null,
      // Only a Competent enrolment gets manual links, one per language.
      // Filenames never leave the API — the browser only sees signed tokens.
      trainings:
        trainings.status === "fulfilled"
          ? trainings.value.map((t) => ({
              ...t,
              manuals: t.competent
                ? manualsFor(t.courseName).map(({ lang, label, file }) => ({ lang, label, token: mintManualToken(file) }))
                : [],
            }))
          : null,
    },
  };
}

app.http("me", {
  methods: ["GET", "PUT", "DELETE"],
  // The Entra access token is the credential, checked in signedInUser().
  authLevel: "anonymous",
  route: "me",
  handler: me,
});
