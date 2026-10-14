// Self-check for the manual endpoint's view-only guard. Run: npm run check
import { strict as assert } from "assert";
import * as path from "path";

process.env.MANUAL_TOKEN_SECRET = "test-secret";
process.env.MANUALS_DIR = path.join(__dirname, "..", "..", "manuals");

import { HttpRequest, InvocationContext } from "@azure/functions";
import { manual } from "./functions/manual";
import { mintManualToken } from "./token";

// Only the two accessors the handler uses.
function request(token: string, secFetchDest?: string): HttpRequest {
  return {
    query: new URLSearchParams({ t: token }),
    headers: new Headers(secFetchDest ? { "sec-fetch-dest": secFetchDest } : {}),
  } as unknown as HttpRequest;
}

const context = { error: () => {} } as unknown as InvocationContext;
const token = mintManualToken("bfa.pdf");

async function main() {
  // The portal's own fetch is what should be served.
  const fetched = await manual(request(token, "empty"), context);
  assert.equal(fetched.status, 200, "a same-page fetch gets the PDF");
  assert.equal(
    (fetched.headers as Record<string, string>)["Content-Type"],
    "application/pdf",
    "served as a PDF"
  );

  // Everything that would open the browser's PDF viewer, with its Download and
  // Print buttons, is refused.
  for (const dest of ["document", "iframe", "embed", "object"]) {
    const blocked = await manual(request(token, dest), context);
    assert.equal(blocked.status, 403, `Sec-Fetch-Dest: ${dest} is refused`);
  }

  // A client that sends no Sec-Fetch-Dest at all (curl) still needs a token.
  assert.equal((await manual(request(token), context)).status, 200, "no header still needs a valid token");
  assert.equal((await manual(request("garbage", "empty"), context)).status, 403, "a bad token is refused");

  console.log("manual endpoint checks passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
