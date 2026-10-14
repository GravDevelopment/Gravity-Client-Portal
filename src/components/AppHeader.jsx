import { signOut } from '../auth';
import logo from '../assets/logo.png';

/** Top bar on every signed-in screen: logo, who is signed in, Sign out. */
export default function AppHeader({ name }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-brand">
          <img src={logo} alt="Gravity Training" className="topbar-logo" />
          <span className="topbar-divider" aria-hidden="true" />
          <span className="topbar-product">Client portal</span>
        </div>
        <div className="topbar-user">
          {name && <span className="topbar-name">{name}</span>}
          <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
