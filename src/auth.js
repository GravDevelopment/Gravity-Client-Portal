import { InteractionRequiredAuthError, PublicClientApplication } from '@azure/msal-browser';

// Clients sign in through the "Gravity Training Clients" Entra External ID
// tenant — separate from the staff tenant, open to any email address. These
// values are public identifiers, not secrets.
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
const authority = import.meta.env.VITE_ENTRA_AUTHORITY; // https://<tenant-id>.ciamlogin.com/<tenant-id>

// Must match a SPA redirect URI on the app registration exactly:
// http://localhost:59640 locally, https://gravitycandidateportal.co.za live.
const base = import.meta.env.BASE_URL;
const redirectUri = base === '/' ? window.location.origin : window.location.origin + base;

const msal = new PublicClientApplication({
  auth: {
    clientId,
    authority,
    knownAuthorities: [new URL(authority).host],
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  // Signed out when the tab closes — the portal may be used on shared machines.
  cache: { cacheLocation: 'sessionStorage' },
});

const scopes = [`api://${clientId}/access_as_user`];

/** Finishes any sign-in redirect; returns the signed-in account or null. */
export async function startAuth() {
  await msal.initialize();
  const result = await msal.handleRedirectPromise();
  const account = result?.account ?? msal.getAllAccounts()[0] ?? null;
  if (account) msal.setActiveAccount(account);
  return account;
}

export const signIn = () => msal.loginRedirect({ scopes });
export const signUp = () => msal.loginRedirect({ scopes, prompt: 'create' });
export const signOut = () => msal.logoutRedirect();

export async function accessToken() {
  try {
    return (await msal.acquireTokenSilent({ scopes, account: msal.getActiveAccount() })).accessToken;
  } catch (err) {
    // Session expired: send them back through sign-in, which returns here.
    if (err instanceof InteractionRequiredAuthError) await msal.acquireTokenRedirect({ scopes });
    throw err;
  }
}
