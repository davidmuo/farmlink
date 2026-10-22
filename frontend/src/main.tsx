import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { warmUpApi } from './lib/api';
import { clearReloadFlagSoon, reloadOnce } from './lib/chunks';
import './index.css';

// Start waking the API (and open its connection) before React even renders
warmUpApi();

// A code file from an older deploy failed to preload: reload once to get the current version
window.addEventListener('vite:preloadError', event => { if (reloadOnce()) event.preventDefault(); });
clearReloadFlagSoon();

// Offline/repeat-visit cache. Registered after load, when the browser is idle, so it never
// competes with the first paint or the hero video for bandwidth.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const register = () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  // An earlier version of the code cache could store the app page in place of a missing code
  // file; it has been replaced by 'app-chunks-v2', so drop it
  if ('caches' in window) caches.delete('app-chunks').catch(() => {});
  window.addEventListener('load', () => {
    if ('requestIdleCallback' in window) requestIdleCallback(register, { timeout: 8000 });
    else setTimeout(register, 4000);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary><App /></ErrorBoundary>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#171B16',
            border: '1px solid #E2E5DE',
            borderRadius: '10px',
            padding: '10px 14px',
            fontSize: '13px',
            boxShadow: '0 6px 16px -4px rgb(16 24 16 / 0.12)',
          },
          success: { iconTheme: { primary: '#275C41', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
