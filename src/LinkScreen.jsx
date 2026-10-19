import { useState } from 'react';
import { removeLink, saveLink } from './api';
import { SUPPORT_EMAIL, supportMailto } from './support';

/**
 * Connects the signed-in profile to an ID number and a reminder email. Used
 * both for first-time setup and, with `current`, for changing those later.
 */
export default function LinkScreen({ current, suggestedEmail, onSaved, onCancel }) {
  const [idNumber, setIdNumber] = useState(current?.idNumber ?? '');
  const [email, setEmail] = useState(current?.email ?? suggestedEmail ?? '');
  const [reminders, setReminders] = useState(current?.remindersEnabled ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function run(action) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onSaved();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (!idNumber.trim() || !email.trim() || busy) return;
    run(() => saveLink({ idNumber: idNumber.trim(), email: email.trim(), remindersEnabled: reminders }));
  }

  function unlink() {
    if (window.confirm('Remove your ID number and reminder email from this profile?')) run(removeLink);
  }

  return (
    <main className="page page-narrow">
      <div className="panel">
        {!current && <p className="eyebrow">Step 2 of 2</p>}
        <h1 className="panel-title">{current ? 'Your details' : 'Connect your ID number'}</h1>
        <p className="panel-sub">
          {current
            ? 'Change the ID number linked to your profile, or where expiry reminders are sent.'
            : 'We use it to find your certificates and training manuals. Enter it exactly as it appears on your certificate.'}
        </p>

        <form onSubmit={submit} className="form">
          <div className="field">
            <label htmlFor="idNumber">ID number</label>
            {/* Not numeric-only: learner IDs are not all South African 13-digit
                numbers. Other formats in use carry letters and hyphens and run
                past 20 characters. (Never put a real learner's identifier in this repo.) */}
            <input
              id="idNumber"
              className="input input-mono"
              type="text"
              autoComplete="off"
              maxLength={40}
              placeholder="As printed on your certificate"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/[^A-Za-z0-9/-]/g, '').toUpperCase())}
              autoFocus={!current}
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email for reminders</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label className="checkbox">
            <input type="checkbox" checked={reminders} onChange={(e) => setReminders(e.target.checked)} />
            <span>
              <strong>Email me before a certificate expires</strong>
              <span className="checkbox-hint">One reminder, 90 days before the expiry date.</span>
            </span>
          </label>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}{' '}
              <a href={supportMailto('Candidate portal — connecting my ID')}>Contact {SUPPORT_EMAIL}</a>
            </div>
          )}

          <div className="form-actions">
            {current && (
              <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
                Cancel
              </button>
            )}
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Saving…' : current ? 'Save changes' : 'Connect'}
            </button>
          </div>
        </form>

        {current && (
          <div className="danger-zone">
            <div>
              <strong>Remove ID number</strong>
              <p className="muted-text">Unlinks your certificates and stops reminders. Your sign-in stays.</p>
            </div>
            <button type="button" className="btn btn-danger-ghost btn-sm" onClick={unlink} disabled={busy}>
              Remove
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
