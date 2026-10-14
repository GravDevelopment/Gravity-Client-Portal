import { accessToken } from './auth';

// Empty during `npm run dev` (Vite proxies /api to `func start`); set to the
// Function App origin in .env.production.
const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/+$/, '');

async function call(method, body) {
  const response = await fetch(`${API_BASE}/api/me`, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const { error } = await response.json().catch(() => ({}));
    throw new Error(error || 'Something went wrong. Please try again.');
  }
  return response.status === 204 ? null : response.json();
}

/** { profile: null } before an ID is linked; else { profile, certificates, trainings }. */
export const getMe = () => call('GET');
export const saveLink = (link) => call('PUT', link);
export const removeLink = () => call('DELETE');

// The token is an opaque, expiring grant minted by the API for a course the
// learner passed — it carries no ID number, so this is safe to put in a URL.
export function manualUrl(manualToken) {
  return `${API_BASE}/api/manual?t=${encodeURIComponent(manualToken)}`;
}
