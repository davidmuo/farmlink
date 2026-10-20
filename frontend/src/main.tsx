import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { warmUpApi } from './lib/api';
import './index.css';

// Start waking the API (and open its connection) before React even renders
warmUpApi();

// Offline/repeat-visit cache. Registered after load, when the browser is idle, so it never
// competes with the first paint or the hero video for bandwidth.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const register = () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  window.addEventListener('load', () => {
    if ('requestIdleCallback' in window) requestIdleCallback(register, { timeout: 8000 });
    else setTimeout(register, 4000);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
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
