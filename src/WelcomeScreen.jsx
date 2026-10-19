import { signIn, signUp } from './auth';
import logo from './assets/logo.png';

const FEATURES = [
  ['Certificates', 'See every certificate, with its issue and expiry date.'],
  ['Training manuals', 'Read the manuals for the courses you passed.'],
  ['Expiry reminders', 'Get an email 90 days before a certificate expires.'],
];

export default function WelcomeScreen() {
  return (
    <main className="welcome">
      <div className="welcome-card">
        <img src={logo} alt="Gravity Training" className="welcome-logo" />
        <h1 className="welcome-title">Candidate portal</h1>
        <p className="welcome-sub">Your Gravity Training certificates and manuals, in one place.</p>

        <ul className="features">
          {FEATURES.map(([title, text]) => (
            <li key={title}>
              <span className="feature-tick" aria-hidden="true">✓</span>
              <span>
                <strong>{title}</strong>
                <span className="muted-text">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="welcome-actions">
          <button className="btn btn-primary btn-lg" onClick={signUp}>
            Create a profile
          </button>
          <button className="btn btn-secondary btn-lg" onClick={signIn}>
            Sign in
          </button>
        </div>

        {/* Password reset lives on Microsoft's sign-in page (self-service
            password reset, by emailed code) — this just says where to find it. */}
        <p className="welcome-help">
          <button type="button" className="link-button" onClick={signIn}>
            Forgot your password?
          </button>{' '}
          Choose this, enter your email, then select <strong>Forgot password?</strong> to get a reset code by email.
        </p>
      </div>
      <p className="welcome-foot">© Gravity Training (Pty) Ltd</p>
    </main>
  );
}
