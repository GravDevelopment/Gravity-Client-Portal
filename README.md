# Gravity Candidate Portal

Clients create a profile, connect it to their ID number, and see their Gravity
Training **certificates** (valid / expiring / expired / flagged) and the
**manuals** for courses they passed. They get **one reminder email 90 days
before a certificate expires**, sent from `certification@gravitygh.co.za`.

It replaces nothing: validateatechnician.co.za and gravitymanuals.co.za keep
running as they are.

## How it fits together

```
Browser (React + Vite)
  │  sign-in ──────────► Entra External ID tenant "Gravity Training Clients"
  │                      (gravityclients.onmicrosoft.com — clients only, any email)
  ▼
Azure Functions API (api/)
  ├─ GET/PUT/DELETE /api/me   the signed-in client's profile + their records
  ├─ GET /api/manual?t=…      streams one manual PDF against a signed token
  └─ timer "reminders"        daily 06:00 SAST
       │
       ├─► Dataverse (staff tenant)   grav_validation (certificates), tct_enroll (trainings)
       ├─► Table Storage              profiles, sent reminders
       └─► Microsoft Graph            sendMail as certification@gravitygh.co.za
```

- **Sign-in**: Entra External ID, a tenant separate from the staff one. Email +
  password, then an emailed code (Conditional Access "Client portal - require
  2FA"). App registration *Gravity Client Portal*, client ID
  `8e0023d3-f9e9-4fdb-a089-dcb8a3000234`, scope `access_as_user`. The API checks
  the token against that tenant's own key set (`<tenant>.ciamlogin.com/.../keys`),
  which holds keys the global `login.microsoftonline.com` set does not.
- **Profiles** are keyed by the client's Entra object ID: ID number, reminder
  email, reminders on/off. A client only ever sees the ID linked to their own
  profile; there is no open search.
- **Linking is ID number only**, by decision. Anyone can link anyone's ID, and
  then sees that person's certificates and manuals and gets their reminders.
  The enrolment's `grav_certificatenumber` is there if a second check is wanted.
- **Certificates** are read straight from `grav_validation` (same fields the
  kiosk's `/api/validate` returns; checked identical) because the kiosk drops
  the enrolment link. Certificates and trainings are **paired by enrolment ID**
  ([src/merge.js](src/merge.js)), never by course name: the two tables name the
  same course differently almost every time. ~95% of certificates carry the
  link; the rest show as their own card.
- **Manuals** work as in Gravity-Manuals: only for Competent enrolments, 1-hour
  HMAC tokens, drawn to a canvas with no download/print, `Sec-Fetch-Dest` guard.
  PDFs in [api/manuals/](api/manuals/), mapped in [api/src/manuals.ts](api/src/manuals.ts).
  This is a separate copy of Gravity-Manuals' PDFs — update both until that site
  is retired.

## Reminder emails

[api/src/reminders.ts](api/src/reminders.ts) picks certificates expiring in
0–90 days (not expired, not fraudulent); [functions/reminders.ts](api/src/functions/reminders.ts)
runs daily and emails each one **once per client** — a row in the `reminders`
table stops repeats. A client who links an ID with a certificate already inside
the window gets that reminder on the next run.

Mail goes through Microsoft Graph as `MAIL_FROM`, using a separate app
registration in the **staff** tenant (*Gravity Portal Mailer*) with the
`Mail.Send` application permission. **That permission must be limited to the
certification mailbox** with an Exchange RBAC for Applications assignment —
without it the app could send as anyone in Gravity. With `MAIL_CLIENT_ID` /
`MAIL_CLIENT_SECRET` unset, runs only log `WOULD EMAIL …` and record nothing.

Trigger a run by hand while `func start` is running:

```
curl -X POST http://localhost:7071/admin/functions/reminders -H "Content-Type: application/json" -d "{}"
```

## Run locally

```
cd api
cp local.settings.json.template local.settings.json   # fill in the values
npm install
npm run storage    # terminal 1: Azurite (Table Storage emulator)
npm start          # terminal 2: API on :7071

# terminal 3, from this folder
npm install
npm run dev        # http://localhost:59640, proxies /api to :7071
```

Settings in `api/local.settings.json` (gitignored):

| Setting | What |
|---|---|
| `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`, `DATAVERSE_URL` | Dataverse access — same as `gravity-manuals-api` (`az functionapp config appsettings list -g gravity-manuals-rg -n gravity-manuals-api`) |
| `MANUAL_TOKEN_SECRET` | signs manual links; any long random string |
| `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID` | the client sign-in tenant and app |
| `AzureWebJobsStorage` | `UseDevelopmentStorage=true` locally |
| `MAIL_FROM`, `MAIL_CLIENT_ID`, `MAIL_CLIENT_SECRET` | reminder sending (see above) |
| `PORTAL_URL` | link put in reminder emails |

The front end's sign-in settings are in [.env](.env) (public identifiers, not
secrets); `VITE_API_BASE` in [.env.production](.env.production).

## Checks

```
npm run check            # pairing, certificate status
cd api && npm run check  # manual tokens, view-only guard, certificate mapping, reminder rules
```

## Deploy

Live at **https://gravitycandidateportal.co.za**.

1. A Function App for `api/` (Node 20+), with the settings above,
   `PORTAL_URL=https://gravitycandidateportal.co.za` and CORS allowing that
   origin. `cd api && func azure functionapp publish <name>`.
2. `https://gravitycandidateportal.co.za` (no trailing slash) is a **SPA
   redirect URI** on the *Gravity Client Portal* app registration.
3. The front end is served by GitHub Pages from **`main` / `/docs`** (Settings →
   Pages → Deploy from a branch), custom domain set, HTTPS enforced. Nothing is
   built on GitHub: the built site is committed. To release:

   ```
   npm run check
   npm run build      # writes docs/ (emptied first; CNAME and .nojekyll come from public/)
   git add docs && git commit -m "Build" && git push
   ```

   DNS: apex A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
   `185.199.111.153`; optional `www` CNAME to `gravdevelopment.github.io`.
