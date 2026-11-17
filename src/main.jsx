import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// A tab opened before a release still asks for the old build's chunks (e.g. the
// PDF viewer), which are gone. Reload once to pick up the new build; the time
// guard stops a reload loop if a chunk is genuinely missing.
window.addEventListener('vite:preloadError', (event) => {
  let last = 0;
  try {
    last = Number(sessionStorage.getItem('chunkReload')) || 0;
    sessionStorage.setItem('chunkReload', String(Date.now()));
  } catch {
    // storage blocked: still reload, the guard just won't apply
  }
  if (Date.now() - last < 10_000) return;
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
