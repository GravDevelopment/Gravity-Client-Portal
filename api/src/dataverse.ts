import { ConfidentialClientApplication } from "@azure/msal-node";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function dataverseUrl(): string {
  return requiredEnv("DATAVERSE_URL").replace(/\/+$/, "");
}

let msalClient: ConfidentialClientApplication | null = null;
function getMsalClient(): ConfidentialClientApplication {
  if (!msalClient) {
    msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: requiredEnv("CLIENT_ID"),
        authority: `https://login.microsoftonline.com/${requiredEnv("TENANT_ID")}`,
        clientSecret: requiredEnv("CLIENT_SECRET"),
      },
    });
  }
  return msalClient;
}

async function getAccessToken(): Promise<string> {
  const result = await getMsalClient().acquireTokenByClientCredential({
    scopes: [`${dataverseUrl()}/.default`],
  });
  if (!result?.accessToken) throw new Error("Failed to acquire Dataverse access token");
  return result.accessToken;
}

async function dataverseFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const response = await fetch(`${dataverseUrl()}/api/data/v9.2/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      "Content-Type": "application/json",
      // Ask Dataverse to include the "@Microsoft.Dynamics.CRM.lookuplogicalname"
      // annotation on every lookup value — we use it to discover the target
      // entity of custom lookups (their column name doesn't always match).
      Prefer: 'odata.include-annotations="*"',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  return response;
}

export interface Training {
  enrollId: string;
  firstName: string;
  lastName: string;
  courseName: string | null;
  designation: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  competent: boolean;
}

// tct_assessmentstatus option set. tct_passfail looks like the field for this
// but is null on every row — don't use it.
const ASSESSMENT_STATUS: Record<number, string> = {
  0: "In Training",
  1: "Competent",
  2: "Not Yet Competent",
  3: "Did not Finish",
};
const COMPETENT = 1;

interface CourseRow {
  grav_coursename?: string | null;
  grav_designation?: string | null;
}

interface BookingRow {
  grav_startdate?: string | null;
  grav_enddate?: string | null;
}

function mapRow(row: any, course: CourseRow, booking: BookingRow): Training {
  const status: number | null = row.tct_assessmentstatus ?? null;
  return {
    enrollId: row.tct_enrollid,
    status: status === null ? null : ASSESSMENT_STATUS[status] ?? null,
    competent: status === COMPETENT,
    firstName: row.grav_learnerfirstname ?? "",
    lastName: row.grav_learnerlastname ?? "",
    courseName: course.grav_coursename ?? null,
    designation: course.grav_designation ?? null,
    startDate: booking.grav_startdate ? String(booking.grav_startdate).slice(0, 10) : null,
    endDate: booking.grav_enddate ? String(booking.grav_enddate).slice(0, 10) : null,
  };
}

// Dataverse's URL entity-set names (e.g. "grav_courses" vs "grav_courseSet" vs
// something custom) are chosen per-table and don't always match logicalName + "s".
// We look them up once via the metadata endpoint and cache.
const entitySetCache = new Map<string, string>();
async function getEntitySetName(logicalName: string): Promise<string> {
  const cached = entitySetCache.get(logicalName);
  if (cached) return cached;
  const response = await dataverseFetch(`EntityDefinitions(LogicalName='${logicalName}')?$select=EntitySetName`);
  if (!response.ok) {
    throw new Error(`Metadata lookup for ${logicalName} failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { EntitySetName?: string };
  if (!body.EntitySetName) throw new Error(`No EntitySetName for ${logicalName}`);
  entitySetCache.set(logicalName, body.EntitySetName);
  return body.EntitySetName;
}

async function fetchOne<T>(logicalName: string, id: string, select: string[]): Promise<T | null> {
  const entitySet = await getEntitySetName(logicalName);
  const response = await dataverseFetch(`${entitySet}(${id})?$select=${select.join(",")}`);
  if (!response.ok) {
    const body = await response.text();
    console.error(`Dataverse fetch ${entitySet}(${id}) failed: ${response.status} ${body}`);
    return null;
  }
  return (await response.json()) as T;
}

export interface Certificate {
  certificateId: string;
  enrollId: string | null;
  idNumber: string;
  name: string;
  surname: string;
  course: string;
  dateIssued: string;
  revalidationDate: string;
  fraudulent: boolean;
}

// Same table and fields the kiosk's /api/validate reads (checked to give
// identical results). Read here instead because the kiosk drops the enrolment
// link, and that link is the only reliable way to pair a certificate with its
// training: the course names on the two tables almost never match.
export function mapCertificate(row: any): Certificate {
  return {
    certificateId: row.grav_validationid ?? "",
    enrollId: row._grav_enroll_value ?? null,
    idNumber: row.grav_idnumber ?? "",
    name: row.grav_name ?? "",
    surname: row.grav_surname ?? "",
    course: row.grav_course ?? "",
    dateIssued: row.grav_dateissued ? String(row.grav_dateissued).slice(0, 10) : "",
    revalidationDate: row.grav_revalidationdate ? String(row.grav_revalidationdate).slice(0, 10) : "",
    fraudulent: row.grav_fraudulent === true,
  };
}

export async function searchCertificatesByIdNumber(idNumber: string): Promise<Certificate[]> {
  const entitySet = await getEntitySetName("grav_validation");
  const filter = `grav_idnumber eq '${idNumber.replace(/'/g, "''")}'`;
  const select = "grav_validationid,grav_idnumber,grav_name,grav_surname,grav_course,grav_dateissued,grav_revalidationdate,grav_fraudulent,_grav_enroll_value";
  const response = await dataverseFetch(`${entitySet}?$select=${select}&$filter=${encodeURIComponent(filter)}`);
  if (!response.ok) {
    throw new Error(`Dataverse certificate search failed: ${response.status} ${await response.text()}`);
  }
  const body = await response.json();
  return (body.value ?? []).map(mapCertificate);
}

/**
 * Returns the learner's trainings for an ID number, or [] if there are none.
 *
 * The ID number is the only thing asked for. A certificate-number check used to
 * sit here as a second factor; it was removed on request, so anyone who knows or
 * guesses an ID number can read that learner's record. Competency still gates
 * the manuals themselves.
 */
export async function searchTrainingsByLearnerId(idNumber: string): Promise<Training[]> {
  const filter = `grav_learnerid eq '${idNumber.replace(/'/g, "''")}'`;
  const response = await dataverseFetch(`tct_enrolls?$filter=${encodeURIComponent(filter)}`);
  if (!response.ok) {
    throw new Error(`Dataverse search failed: ${response.status} ${await response.text()}`);
  }
  const body = await response.json();
  const rows: any[] = body.value ?? [];


  // Dedupe fetches by (target-entity, id), so a learner with 3 enrollments in
  // the same course only fires one course fetch.
  interface LookupRef { id: string; target: string; }
  function collectRefs(valueField: string, targetField: string): LookupRef[] {
    const seen = new Set<string>();
    const out: LookupRef[] = [];
    for (const r of rows) {
      const id: string | undefined = r[valueField];
      const target: string | undefined = r[targetField];
      if (!id || !target) continue;
      const key = `${target}|${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ id, target });
    }
    return out;
  }

  const courseRefs = collectRefs("_grav_course_value", "_grav_course_value@Microsoft.Dynamics.CRM.lookuplogicalname");
  const bookingRefs = collectRefs("_tct_booking_value", "_tct_booking_value@Microsoft.Dynamics.CRM.lookuplogicalname");

  const [courses, bookings] = await Promise.all([
    Promise.all(courseRefs.map((r) => fetchOne<CourseRow>(r.target, r.id, ["grav_coursename", "grav_designation"]))),
    Promise.all(bookingRefs.map((r) => fetchOne<BookingRow>(r.target, r.id, ["grav_startdate", "grav_enddate"]))),
  ]);

  const courseById = new Map(courseRefs.map((r, i) => [r.id, courses[i] ?? {}]));
  const bookingById = new Map(bookingRefs.map((r, i) => [r.id, bookings[i] ?? {}]));

  const trainings = rows.map((r) => mapRow(r, courseById.get(r._grav_course_value) ?? {}, bookingById.get(r._tct_booking_value) ?? {}));

  // Unlike the sign-in kiosk (today's courses only), the manuals portal shows
  // every training that has already started — learners come back for manuals
  // long after the course ended. Future bookings are hidden.
  const today = new Date().toISOString().slice(0, 10);
  return trainings
    .filter((t) => t.startDate !== null && t.startDate <= today)
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));
}
