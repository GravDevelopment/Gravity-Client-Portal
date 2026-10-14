import { HttpRequest } from "@azure/functions";
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

// Clients sign in through the "Gravity Training Clients" Entra External ID
// tenant. The portal sends the access token it gets for this API's
// access_as_user scope; this checks it was issued by that tenant, for this app,
// and returns the client's stable object ID — the key their profile is stored by.

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export class Unauthorized extends Error {}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const tenantId = requiredEnv("ENTRA_TENANT_ID");
  const clientId = requiredEnv("ENTRA_CLIENT_ID");
  // The external tenant's own key set: it holds signing keys the global
  // login.microsoftonline.com key set does not, so tokens fail against that one.
  jwks ??= createRemoteJWKSet(new URL(`https://${tenantId}.ciamlogin.com/${tenantId}/discovery/v2.0/keys`));

  const { payload } = await jwtVerify(token, jwks, {
    // v1 and v2 access tokens carry different issuer and audience forms.
    issuer: [
      `https://${tenantId}.ciamlogin.com/${tenantId}/v2.0`,
      `https://login.microsoftonline.com/${tenantId}/v2.0`,
      `https://sts.windows.net/${tenantId}/`,
    ],
    audience: [clientId, `api://${clientId}`],
  });
  const scopes = String(payload.scp ?? "").split(" ");
  if (payload.tid !== tenantId || !scopes.includes("access_as_user") || typeof payload.oid !== "string") {
    throw new Unauthorized("token is not for this portal");
  }
  return payload;
}

/** The signed-in client's object ID, or throws Unauthorized. */
export async function signedInUser(request: HttpRequest): Promise<string> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer (.+)$/i.exec(header);
  if (!match) throw new Unauthorized("no bearer token");
  try {
    return (await verifyToken(match[1])).oid as string;
  } catch (err) {
    // Say which claim didn't fit — never the token itself.
    let claims = "";
    try {
      const c = JSON.parse(Buffer.from(match[1].split(".")[1], "base64url").toString());
      claims = ` (ver=${c.ver} iss=${c.iss} aud=${c.aud} scp=${c.scp})`;
    } catch {}
    const reason = err instanceof Unauthorized ? err.message : `invalid token: ${(err as Error).message}`;
    throw new Unauthorized(reason + claims);
  }
}
