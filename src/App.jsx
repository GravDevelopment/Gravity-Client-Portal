import { useCallback, useEffect, useState } from 'react';
import './App.css';
import { getMe } from './api';
import { startAuth } from './auth';
import AppHeader from './components/AppHeader';
import DashboardScreen from './DashboardScreen';
import LinkScreen from './LinkScreen';
import WelcomeScreen from './WelcomeScreen';

// The sign-up email, if the ID token carries it (the "email" optional claim).
// The account's username is an internal <guid>@<tenant>.onmicrosoft.com name,
// never a real inbox, so it is not offered.
function suggestedEmail(account) {
  const claims = account.idTokenClaims ?? {};
  const email = claims.email ?? claims.emails?.[0] ?? account.username ?? '';
  return /@.+\.onmicrosoft\.com$/i.test(email) ? '' : email;
}

const titleCase = (s) => s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());

// First name as Gravity has it on the certificate, else the sign-up display name.
function firstName(me, account) {
  const fromRecords = me?.certificates?.[0]?.name || me?.trainings?.[0]?.firstName;
  const name = fromRecords || account?.name || '';
  return name && !/@/.test(name) ? titleCase(name.trim().split(/\s+/)[0]) : '';
}

// signed out → Welcome; signed in with no ID linked → Link; else → Dashboard.
export default function App() {
  const [account, setAccount] = useState(undefined); // undefined while starting
  const [me, setMe] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setEditing(false);
    setMe(null);
    try {
      setMe(await getMe());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    startAuth()
      .then((a) => {
        setAccount(a);
        if (a) load();
      })
      .catch((e) => {
        console.error('Sign-in failed', e);
        setAccount(null);
        setError("Sign-in didn't complete. Please try again.");
      });
  }, [load]);

  if (account === undefined) return <div className="center-screen"><div className="spinner" aria-label="Loading" /></div>;
  if (!account) return <WelcomeScreen />;

  let screen;
  if (error) {
    screen = (
      <div className="center-block">
        <p className="alert alert-danger">{error}</p>
        <button className="btn btn-primary" onClick={load}>
          Try again
        </button>
      </div>
    );
  } else if (!me) {
    screen = <div className="center-block"><div className="spinner" aria-label="Loading" /></div>;
  } else if (!me.profile || editing) {
    screen = (
      <LinkScreen
        current={me.profile}
        suggestedEmail={suggestedEmail(account)}
        onSaved={load}
        onCancel={() => setEditing(false)}
      />
    );
  } else {
    screen = <DashboardScreen {...me} displayName={firstName(me, account)} onEditDetails={() => setEditing(true)} />;
  }

  return (
    <div className="shell">
      <AppHeader name={me?.profile ? firstName(me, account) : account.name && !/@/.test(account.name) ? account.name : ''} />
      {screen}
    </div>
  );
}
