# Course manuals

These PDFs are served **only** by `GET /api/manual`, which requires a signed,
one-hour token minted by `/api/trainings` for an enrollment marked *Competent*.
They deliberately do not live in the front-end's `public/` folder — anything in
there is fetchable by URL with no check at all.

To add a manual:

1. Drop the PDF in this folder. Name it `lowercase-with-hyphens.pdf` —
   `api/src/functions/manual.ts` rejects anything else.
2. Map the Dataverse course name to it in [`../src/manuals.ts`](../src/manuals.ts):

```ts
const MANUALS: Record<string, string> = {
  'First Aid Training': 'first-aid.pdf',
};
```

The key must match `grav_coursename` exactly. Courses with no entry show
"Manual not available yet" in the portal.
