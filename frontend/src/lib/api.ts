import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export const API_URL: string = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Any write can change what the reads return, so drop cached reads before and after it
  if ((config.method ?? 'get').toLowerCase() !== 'get') clearApiCache();
  return config;
});

// A wrong password on the sign-in / sign-up forms is an ordinary 401, not an expired session
const CREDENTIAL_ROUTES = /^\/auth\/(login|register)\b/;

api.interceptors.response.use(
  (res) => {
    if ((res.config.method ?? 'get').toLowerCase() !== 'get') clearApiCache();
    return res;
  },
  (err) => {
    if ((err.config?.method ?? 'get').toLowerCase() !== 'get') clearApiCache();
    if (err.response?.status === 401 && !CREDENTIAL_ROUTES.test(err.config?.url ?? '')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      clearApiCache();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/* ─── Read cache ──────────────────────────────────────────────
   GET responses are kept briefly per signed-in user so moving between pages is instant.
   Identical requests in flight share one network call. Endpoints that are polled for
   live updates are never cached. */

const NEVER_CACHE = [/^\/notifications/, /^\/messages/, /^\/auth\//, /^\/sms\//, /^\/ai\//, /^\/ussd/, /^\/health/];
const LONG_LIVED  = [/^\/crops/, /^\/market-prices/];

const ttlFor = (url: string) =>
  NEVER_CACHE.some(r => r.test(url)) ? 0 : LONG_LIVED.some(r => r.test(url)) ? 5 * 60_000 : 30_000;

const cache = new Map<string, { at: number; res: AxiosResponse }>();
const inflight = new Map<string, Promise<AxiosResponse>>();
let generation = 0;

export function clearApiCache() {
  generation++;
  cache.clear();
  inflight.clear();
}

const keyFor = (url: string, config?: AxiosRequestConfig) =>
  `${localStorage.getItem('token') ?? ''}|${url}|${JSON.stringify(config?.params ?? {})}`;

// Hand every caller its own copy so one page can't mutate another's data
const fresh = (res: AxiosResponse): AxiosResponse => ({ ...res, data: structuredClone(res.data) });

const networkGet = api.get.bind(api);

api.get = (async (url: string, config?: AxiosRequestConfig) => {
  const ttl = ttlFor(url);
  if (!ttl || (config?.responseType && config.responseType !== 'json')) return networkGet(url, config);

  const key = keyFor(url, config);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return fresh(hit.res);

  let pending = inflight.get(key);
  if (!pending) {
    const gen = generation;
    pending = networkGet(url, config)
      .then(res => {
        if (gen === generation) cache.set(key, { at: Date.now(), res });
        return res;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return fresh(await pending);
}) as typeof api.get;

// Warm the cache ahead of navigation; failures are ignored
export function prefetchGet(url: string, config?: AxiosRequestConfig) {
  if (!localStorage.getItem('token')) return;
  api.get(url, config).catch(() => {});
}

// Open the connection and wake the API (the free-tier host sleeps when idle) as soon as the app loads
export function warmUpApi() {
  try {
    const origin = new URL(API_URL, window.location.href).origin;
    if (origin !== window.location.origin) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    fetch(`${API_URL}/health`, { cache: 'no-store' }).catch(() => {});
  } catch { /* non-critical */ }
}

export default api;
