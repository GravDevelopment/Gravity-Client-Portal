import { useState } from 'react';
import { manualUrl } from './api';
import PdfViewer from './components/PdfViewer';
import { certificateStatus, mergeResults } from './merge';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONES, supportMailto } from './support';

const tel = (number) => `tel:${number.replace(/\s/g, '')}`;

const formatDate = (iso) => {
  const date = iso && new Date(`${iso}T00:00:00Z`);
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : '—';
};

function StatusBadge({ status }) {
  const { kind, daysLeft } = status;
  const label =
    kind === 'fraudulent'
      ? 'Flagged'
      : kind === 'expired'
        ? 'Expired'
        : kind === 'expiring'
          ? daysLeft === 0
            ? 'Expires today'
            : `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
          : 'Valid';
  return <span className={`badge badge-${kind}`}>{label}</span>;
}

// What to tell the client under a certificate that needs action.
function StatusNote({ status }) {
  if (status.kind === 'fraudulent') {
    return (
      <p className="card-note card-note-danger">
        This certificate has been flagged as fraudulent. Please contact us on{' '}
        <a href={tel(SUPPORT_PHONE)}>{SUPPORT_PHONE}</a>.
      </p>
    );
  }
  if (status.kind === 'expired' || status.kind === 'expiring') {
    return (
      <p className="card-note card-note-warning">
        {status.kind === 'expired' ? 'This certificate has expired.' : 'Book your recertification before it expires.'}{' '}
        Call <a href={tel(SUPPORT_PHONE)}>{SUPPORT_PHONE}</a> or{' '}
        <a href={supportMailto('Recertification booking')}>email us</a>.
      </p>
    );
  }
  return null;
}

// Why there's no manual to open. The API only issues links for a course the
// learner is marked Competent on, so say which of those two it is.
function manualNotice(training) {
  if (training.competent) return 'Manual not available yet';
  if (training.status === 'In Training') return 'Manual available once marked competent';
  return 'No manual — not marked competent';
}

/**
 * One button when there's a single manual; a language dropdown beside it when
 * the course has translations. Each card keeps its own selection.
 */
function ManualLinks({ manuals, courseName, onOpen }) {
  const [lang, setLang] = useState(manuals[0].lang);
  const chosen = manuals.find((m) => m.lang === lang) ?? manuals[0];

  return (
    <div className="manual-links">
      {manuals.length > 1 && (
        <select className="select" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Manual language">
          {manuals.map((m) => (
            <option key={m.lang} value={m.lang}>
              {m.label}
            </option>
          ))}
        </select>
      )}
      {/* A button, not a link: the manual opens in our own canvas viewer rather
          than the browser's PDF viewer, which would offer Download and Print. */}
      <button
        type="button"
        className="btn btn-primary btn-sm"
        lang={chosen.lang}
        onClick={() => onOpen({ url: manualUrl(chosen.token), title: courseName })}
      >
        View manual
      </button>
    </div>
  );
}

function CourseCard({ card, onOpen }) {
  const { certificate, training } = card;
  const manuals = training?.manuals ?? [];
  const status = certificate ? certificateStatus(certificate) : null;

  return (
    <li className="course-card">
      <div className="card-head">
        <div>
          <h3 className="course-name">{card.courseName || 'Course'}</h3>
          {training?.designation && training.designation !== card.courseName && (
            <p className="course-sub">{training.designation}</p>
          )}
        </div>
        {status ? <StatusBadge status={status} /> : <span className="badge badge-neutral">No certificate yet</span>}
      </div>

      <dl className="facts">
        {certificate && (
          <>
            <div>
              <dt>Issued</dt>
              <dd>{formatDate(certificate.dateIssued)}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{formatDate(certificate.revalidationDate)}</dd>
            </div>
          </>
        )}
        <div>
          <dt>Training</dt>
          <dd>
            {training
              ? `${formatDate(training.startDate)}${training.endDate && training.endDate !== training.startDate ? ` – ${formatDate(training.endDate)}` : ''}`
              : 'Not on record'}
          </dd>
        </div>
        {training?.status && (
          <div>
            <dt>Result</dt>
            <dd>{training.status}</dd>
          </div>
        )}
      </dl>

      {status && <StatusNote status={status} />}

      <div className="card-foot">
        {manuals.length > 0 ? (
          <ManualLinks manuals={manuals} courseName={card.courseName || 'Manual'} onOpen={onOpen} />
        ) : (
          training && <span className="muted-text">{manualNotice(training)}</span>
        )}
      </div>
    </li>
  );
}

function Stat({ value, label, tone }) {
  return (
    <div className={`stat stat-${tone}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function DashboardScreen({ profile, certificates, trainings, displayName, onEditDetails }) {
  const [viewing, setViewing] = useState(null);

  if (viewing) {
    return <PdfViewer url={viewing.url} title={viewing.title} onClose={() => setViewing(null)} />;
  }

  const cards = mergeResults(certificates ?? [], trainings ?? []);
  const counts = { valid: 0, expiring: 0, expired: 0, fraudulent: 0 };
  for (const c of certificates ?? []) counts[certificateStatus(c).kind]++;
  const manualCount = (trainings ?? []).filter((t) => t.manuals?.length).length;

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <h1 className="page-title">Welcome back{displayName ? `, ${displayName}` : ''}</h1>
          <p className="page-sub">
            ID number <strong>{profile.idNumber}</strong>
            <span className="dot" aria-hidden="true">·</span>
            {profile.remindersEnabled ? (
              <>
                Reminders to <strong>{profile.email}</strong>
              </>
            ) : (
              'Expiry reminders off'
            )}
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onEditDetails}>
          Edit details
        </button>
      </section>

      <section className="stats" aria-label="Summary">
        <Stat value={counts.valid} label="Valid" tone="valid" />
        <Stat value={counts.expiring} label="Expiring within 90 days" tone="expiring" />
        <Stat value={counts.expired + counts.fraudulent} label="Expired or flagged" tone="expired" />
        <Stat value={manualCount} label={manualCount === 1 ? 'Manual available' : 'Manuals available'} tone="neutral" />
      </section>

      {(certificates === null || trainings === null) && (
        <div className="alert alert-warning" role="status">
          {certificates === null
            ? "Certificates couldn't be loaded right now, so only trainings are shown."
            : "Manuals couldn't be loaded right now, so only certificates are shown."}{' '}
          Please try again later.
        </div>
      )}

      <section>
        <h2 className="section-title">Certificates &amp; manuals</h2>
        {cards.length === 0 && certificates !== null && trainings !== null ? (
          <div className="empty">No certificates or trainings are on record for this ID number yet.</div>
        ) : (
          <ul className="course-grid">
            {cards.map((card, i) => (
              <CourseCard key={i} card={card} onOpen={setViewing} />
            ))}
          </ul>
        )}
      </section>

      <section className="help-card">
        <div>
          <h2 className="help-title">Need help?</h2>
          <p className="muted-text">Our certification team can help with certificates, manuals and recertification.</p>
        </div>
        <div className="help-links">
          <a href={supportMailto('Client portal — help')}>{SUPPORT_EMAIL}</a>
          {SUPPORT_PHONES.map((n) => (
            <a key={n} href={tel(n)}>
              {n}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
