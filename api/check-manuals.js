#!/usr/bin/env node
// Reports what has changed in the SharePoint "Manuals" folder since the last
// import, by diffing a fresh listing against manuals/BASELINE.json.
//
//   node check-manuals.js listing.json
//   node check-manuals.js < listing.json
//
// To produce listing.json without any Graph permission: open the Manuals folder
// in SharePoint, open the browser console (F12) and run the snippet printed by
//
//   node check-manuals.js --snippet
//
// then save what it copies to your clipboard. Once the app registration is
// granted Sites.Selected this can fetch the listing itself and run on a timer.

const fs = require("fs");
const path = require("path");

const FOLDER =
  "/sites/GravityGH/Gravity GH/Gravity Data/Gravity Training/B Training/Design and Development/Manuals";

const SNIPPET = `
const FOLDER = ${JSON.stringify(FOLDER)};
const r = await fetch("https://gravitygh.sharepoint.com/sites/GravityGH/_api/web/GetFolderByServerRelativeUrl('" + encodeURIComponent(FOLDER) + "')?$expand=Files&$select=Files/Name,Files/Length,Files/TimeLastModified", { headers: { Accept: "application/json;odata=verbose" } });
const files = (await r.json()).d.Files.results.map(f => ({ name: f.Name, bytes: +f.Length, modified: f.TimeLastModified })).sort((a,b)=>a.name.localeCompare(b.name));
copy(JSON.stringify({ folder: FOLDER, files }, null, 1));
console.log(files.length + " files copied to clipboard");
`.trim();

function loadBaseline() {
  const p = path.join(__dirname, "manuals", "BASELINE.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function readListing(arg) {
  if (arg && arg !== "-") return JSON.parse(fs.readFileSync(arg, "utf8"));
  const stdin = fs.readFileSync(0, "utf8").trim();
  if (!stdin) {
    console.error("No listing given. Pass a file, or pipe one in. See --snippet.");
    process.exit(2);
  }
  return JSON.parse(stdin);
}

function main() {
  const arg = process.argv[2];
  if (arg === "--snippet") {
    console.log("Paste this into the browser console on the SharePoint Manuals folder:\n");
    console.log(SNIPPET);
    return;
  }

  const baseline = loadBaseline();
  const current = readListing(arg);

  const was = new Map(baseline.files.map((f) => [f.name, f]));
  const now = new Map(current.files.map((f) => [f.name, f]));

  const added = [...now.keys()].filter((n) => !was.has(n));
  const removed = [...was.keys()].filter((n) => !now.has(n));
  const changed = [...now.keys()].filter((n) => {
    const a = was.get(n);
    return a && (a.bytes !== now.get(n).bytes || a.modified !== now.get(n).modified);
  });

  console.log(`baseline: ${baseline.files.length} files   current: ${current.files.length} files\n`);

  const show = (label, names, fmt) => {
    if (!names.length) return;
    console.log(`${label} (${names.length}):`);
    for (const n of names) console.log(`  ${fmt(n)}`);
    console.log();
  };

  show("NEW", added, (n) => `${n}  ${(now.get(n).bytes / 1048576).toFixed(1)}MB`);
  show("REMOVED", removed, (n) => n);
  show("CHANGED", changed, (n) => {
    const a = was.get(n), b = now.get(n);
    const size = a.bytes === b.bytes ? `${(b.bytes / 1048576).toFixed(1)}MB` :
      `${(a.bytes / 1048576).toFixed(1)} -> ${(b.bytes / 1048576).toFixed(1)}MB`;
    return `${n}  ${size}  (${a.modified.slice(0, 10)} -> ${b.modified.slice(0, 10)})`;
  });

  if (!added.length && !removed.length && !changed.length) {
    console.log("No changes since the last import.");
    return;
  }

  console.log("To adopt these: copy the changed PDFs into api/manuals/ under their");
  console.log("served names (see manuals/SOURCES.md), update that table, refresh");
  console.log("manuals/BASELINE.json, then:");
  console.log("  func azure functionapp publish gravity-manuals-api");
  process.exitCode = 1; // so a scheduled run can flag drift
}

main();
