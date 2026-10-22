/* After a deploy, a page loaded from an older copy can ask for code files that no longer exist.
   Instead of crashing to a blank screen, the app reloads once to pick up the current version.
   A session flag stops a reload loop when the failure has some other cause (e.g. offline). */

const KEY = 'farmlink:chunk-reload';

export function reloadOnce(): boolean {
  try {
    if (sessionStorage.getItem(KEY)) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

// For code that is about to render: a missing file reloads the page once instead of failing.
// (Prefetches use the plain loader, so a failed prefetch never reloads anything.)
export function withReload<T>(load: () => Promise<T>): () => Promise<T> {
  return () => load().catch(err => {
    if (reloadOnce()) return new Promise<T>(() => {}); // the reload takes over
    throw err;
  });
}

// Once the app has run normally for a while, a later deploy may trigger a reload again
export function clearReloadFlagSoon() {
  window.setTimeout(() => {
    try { sessionStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  }, 10_000);
}
