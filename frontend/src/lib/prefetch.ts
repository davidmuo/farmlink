import { prefetchGet } from './api';

// Page modules, shared with the lazy routes in App.tsx so a prefetched chunk is the one that renders
export const pages = {
  login:              () => import('../pages/Login'),
  register:           () => import('../pages/Register'),
  terms:              () => import('../pages/Terms'),
  privacy:            () => import('../pages/Privacy'),
  profile:            () => import('../pages/Profile'),
  reviews:            () => import('../pages/Reviews'),
  messages:           () => import('../pages/Messages'),
  buyerDashboard:     () => import('../pages/buyer/BuyerDashboard'),
  postDemand:         () => import('../pages/buyer/PostDemand'),
  myDemands:          () => import('../pages/buyer/MyDemands'),
  demandDetail:       () => import('../pages/buyer/DemandDetail'),
  buyerCommitments:   () => import('../pages/buyer/BuyerCommitments'),
  farmerDashboard:    () => import('../pages/farmer/FarmerDashboard'),
  browseDemands:      () => import('../pages/farmer/BrowseDemands'),
  farmerDemandDetail: () => import('../pages/farmer/FarmerDemandDetail'),
  myCommitments:      () => import('../pages/farmer/MyCommitments'),
  farmRecords:        () => import('../pages/farmer/FarmRecords'),
  smsInbox:           () => import('../pages/farmer/SmsInbox'),
  ussdSimulator:      () => import('../pages/farmer/UssdSimulator'),
  adminDashboard:     () => import('../pages/admin/AdminDashboard'),
  adminUsers:         () => import('../pages/admin/AdminUsers'),
  auditLogs:          () => import('../pages/admin/AuditLogs'),
  dashboardLayout:    () => import('../components/DashboardLayout'),
};

type Loader = () => Promise<unknown>;
type Request = [url: string, config?: { params: Record<string, unknown> }];

// What each sidebar destination renders and the reads it starts with (same URLs and params
// as the page itself, so the page finds them already cached)
const ROUTES: Record<string, { page: Loader; data?: (userId?: number) => Request[] }> = {
  '/buyer':              { page: pages.buyerDashboard,   data: () => [['/demands', { params: { mine: true } }], ['/commitments']] },
  '/buyer/demands/new':  { page: pages.postDemand,       data: () => [['/crops']] },
  '/buyer/demands':      { page: pages.myDemands,        data: () => [['/demands', { params: { mine: true } }]] },
  '/buyer/commitments':  { page: pages.buyerCommitments, data: () => [['/commitments']] },
  '/buyer/messages':     { page: pages.messages,         data: () => [['/commitments']] },
  '/buyer/reviews':      { page: pages.reviews,          data: id => (id ? [[`/reviews/user/${id}`], ['/commitments']] : []) },
  '/farmer':             { page: pages.farmerDashboard,  data: () => [['/commitments']] },
  '/farmer/demands':     { page: pages.browseDemands,    data: () => [['/crops'], ['/market-prices'], ['/demands', { params: { status: 'open' } }]] },
  '/farmer/commitments': { page: pages.myCommitments,    data: () => [['/commitments']] },
  '/farmer/records':     { page: pages.farmRecords,      data: () => [['/farm-records'], ['/crops']] },
  '/farmer/messages':    { page: pages.messages,         data: () => [['/commitments']] },
  '/farmer/reviews':     { page: pages.reviews,          data: id => (id ? [[`/reviews/user/${id}`], ['/commitments']] : []) },
  '/farmer/sms':         { page: pages.smsInbox },
  '/farmer/ussd':        { page: pages.ussdSimulator },
  '/admin':              { page: pages.adminDashboard,   data: () => [['/admin/stats'], ['/admin/audit-logs']] },
  '/admin/users':        { page: pages.adminUsers,       data: () => [['/admin/users']] },
  '/admin/audit':        { page: pages.auditLogs,        data: () => [['/admin/audit-logs']] },
  '/profile':            { page: pages.profile },
};

const warmed = new Set<string>();

// Called on hover / focus / touch of a link: fetch the page code and its first reads
export function prefetchRoute(path: string, userId?: number) {
  const route = ROUTES[path];
  if (!route) return;
  route.page().catch(() => {});
  route.data?.(userId).forEach(([url, config]) => prefetchGet(url, config));
}

// Download the code for every page in a role's area while the browser is idle
export function prefetchRolePages(role?: string) {
  if (!role || warmed.has(role)) return;
  warmed.add(role);
  const loaders = Object.entries(ROUTES)
    .filter(([path]) => path.startsWith(`/${role}`) || path === '/profile')
    .map(([, r]) => r.page);
  if (role === 'buyer') loaders.push(pages.demandDetail);
  if (role === 'farmer') loaders.push(pages.farmerDemandDetail);

  const idle = (cb: () => void) =>
    'requestIdleCallback' in window ? (window as any).requestIdleCallback(cb, { timeout: 4000 }) : setTimeout(cb, 1500);
  idle(() => loaders.forEach(load => load().catch(() => {})));
}

// From the public pages, get the sign-in screens ready
export function prefetchAuthPages() {
  const idle = (cb: () => void) =>
    'requestIdleCallback' in window ? (window as any).requestIdleCallback(cb, { timeout: 4000 }) : setTimeout(cb, 2000);
  idle(() => { pages.login().catch(() => {}); pages.register().catch(() => {}); });
}
