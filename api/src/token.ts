import { createHmac, timingSafeEqual } from "crypto";

// A manual link is a signed, expiring capability to read one PDF. It carries no
// learner data, so it can sit in a plain <a href> without putting an ID number
// in a URL or a server log. Only /api/trainings mints one, and only for an
// enrollment that came back marked Competent.
const TTL_SECONDS = 60 * 60;

function secret(): string {
  const value = process.env.MANUAL_TOKEN_SECRET || process.env.CLIENT_SECRET;
  if (!value) throw new Error("Missing MANUAL_TOKEN_SECRET (or CLIENT_SECRET) for manual links");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function mintManualToken(file: string, now = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ f: file, e: Math.floor(now / 1000) + TTL_SECONDS })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Returns the filename the token grants, or null if forged, malformed or expired. */
export function readManualToken(token: string, now = Date.now()): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const { f, e } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof f !== "string" || typeof e !== "number") return null;
    if (e < Math.floor(now / 1000)) return null;
    return f;
  } catch {
    return null;
  }
}
