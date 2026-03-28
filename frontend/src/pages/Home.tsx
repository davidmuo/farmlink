import { Link } from 'react-router-dom';
import {
  ArrowRight, CheckCircle, LayoutDashboard, Search, MessageSquare,
  ShoppingBag, PlusCircle, ChevronRight, CheckSquare, BarChart2, TrendingUp,
  SlidersHorizontal, Send,
} from 'lucide-react';


const GREEN = '#6DFF8A';
const DARK  = '#030712';

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'For Buyers',   href: '#for-buyers'   },
  { label: 'For Farmers',  href: '#for-farmers'  },
];

const Dot = ({ color = GREEN }: { color?: string }) => (
  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
);

/* ── Shared browser chrome ── */
const AppFrame = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <div style={{
    background: dark ? '#111827' : '#fff',
    border: `1px solid ${dark ? '#1f2937' : '#e5e7eb'}`,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: dark ? 'none' : '0 20px 40px -8px rgba(0,0,0,0.10)',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '9px 14px',
      borderBottom: `1px solid ${dark ? '#1f2937' : '#f3f4f6'}`,
      background: dark ? '#0f172a' : '#f9fafb',
    }}>
      {(dark
        ? ['#ef4444', '#f59e0b', '#22c55e']
        : ['#fca5a5', '#fcd34d', '#86efac']
      ).map((c, i) => (
        <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, display: 'inline-block' }} />
      ))}
      <div style={{ flex: 1, marginLeft: 6, background: dark ? '#1f2937' : '#e5e7eb', borderRadius: 5, height: 18, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
        <span style={{ fontSize: 10, color: dark ? '#4b5563' : '#9ca3af' }}>app.farmlink.ng</span>
      </div>
    </div>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════
   MOCKUP 1 — Buyer Dashboard  (mirrors real BuyerDashboard.tsx)
══════════════════════════════════════════════════════ */
const BuyerDashboardMockup = () => {
  const demands = [
    { crop: 'Tomatoes', status: 'open',             val: '₦42,500', pct: 60, offers: 3 },
    { crop: 'Plantain', status: 'partially_filled', val: '₦18,000', pct: 80, offers: 2 },
    { crop: 'Cabbage',  status: 'open',             val: '₦8,000',  pct: 35, offers: 1 },
  ];

  const StatusPill = ({ status }: { status: string }) => {
    const s = status === 'partially_filled'
      ? { bg: GREEN + '22', color: '#16a34a', label: 'partial' }
      : { bg: '#eff6ff', color: '#3b82f6', label: 'open' };
    return <span style={{ background: s.bg, color: s.color, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999 }}>{s.label}</span>;
  };

  return (
    <AppFrame dark>
      <div style={{ display: 'flex', height: 400, fontFamily: "'Inter', sans-serif" }}>
        {/* Sidebar */}
        <div style={{ width: 180, background: '#fff', borderRight: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: '#111827', letterSpacing: -0.3 }}>FarmLink</span>
          </div>
          <nav style={{ padding: '10px 8px', flex: 1 }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, padding: '0 8px', marginBottom: 6 }}>Menu</p>
            {[
              { icon: LayoutDashboard, label: 'Overview',      active: true,  badge: '' },
              { icon: PlusCircle,      label: 'Post Demand',   active: false, badge: '' },
              { icon: ShoppingBag,     label: 'My Demands',    active: false, badge: '' },
              { icon: CheckSquare,     label: 'Farmer Offers', active: false, badge: '3' },
              { icon: MessageSquare,   label: 'Messages',      active: false, badge: '' },
            ].map(item => (
              <div key={item.label} style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 10, marginBottom: 2,
                background: item.active ? '#f9fafb' : 'transparent',
              }}>
                {item.active && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 2, height: 18, borderRadius: 2, background: GREEN }} />}
                <item.icon size={12} style={{ color: item.active ? '#111827' : '#9ca3af', flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: item.active ? 600 : 400, color: item.active ? '#111827' : '#6b7280', flex: 1 }}>{item.label}</span>
                {item.badge && <span style={{ background: GREEN, color: '#111827', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 999 }}>{item.badge}</span>}
              </div>
            ))}
          </nav>
        </div>

        {/* Main */}
        <div style={{ flex: 1, background: '#f9fafb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 18, padding: '0 16px' }}>
            {[['Overview', true], ['My Demands', false], ['Farmer Offers', false]].map(([label, active]) => (
              <div key={label as string} style={{
                fontSize: 11, fontWeight: active ? 600 : 400,
                color: (active as boolean) ? '#111827' : '#9ca3af',
                padding: '10px 0', borderBottom: `2px solid ${(active as boolean) ? GREEN : 'transparent'}`,
                marginBottom: -1,
              }}>{label}</div>
            ))}
            <div style={{ marginLeft: 'auto', paddingBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: GREEN, color: '#111827', fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 7 }}>
                <PlusCircle size={9} /> Post demand
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: 12, overflow: 'hidden' }}>
            {/* Stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid #f3f4f6', borderRadius: 12, background: '#fff', marginBottom: 10, overflow: 'hidden' }}>
              {[
                { label: 'Open demands',    value: '4',     green: false },
                { label: 'In progress',     value: '2',     green: false },
                { label: 'Confirmed value', value: '₦2.1M', green: true  },
                { label: 'Pending offers',  value: '3',     green: false },
              ].map((s, i) => (
                <div key={s.label} style={{ padding: '9px 11px', borderRight: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                  <p style={{ fontSize: 8, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontFamily: "'Syne', sans-serif" }}>{s.label}</p>
                  <p style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.5, color: s.green ? GREEN : '#111827', lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Demand Pipeline */}
            <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 13px', borderBottom: '1px solid #f9fafb' }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>Demand Pipeline</p>
                  <p style={{ fontSize: 9, color: '#9ca3af', marginTop: 1 }}>Total value: ₦68,500</p>
                </div>
                <span style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 2 }}>View all <ChevronRight size={10} /></span>
              </div>
              {demands.map((d, idx) => (
                <div key={d.crop} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px',
                  borderBottom: idx < demands.length - 1 ? '1px solid #f9fafb' : 'none',
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif" }}>{d.crop[0]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>{d.crop}</span>
                      <StatusPill status={d.status} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 70, height: 3, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${d.pct}%`, height: '100%', background: GREEN, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 9, color: '#9ca3af' }}>{d.pct}% filled</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{d.val}</p>
                    <p style={{ fontSize: 9, color: '#9ca3af' }}>{d.offers} offer{d.offers !== 1 ? 's' : ''}</p>
                  </div>
                  <ChevronRight size={10} style={{ color: '#d1d5db', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppFrame>
  );
};

/* ══════════════════════════════════════════════════════
   MOCKUP 2 — Browse Demands  (mirrors real BrowseDemands.tsx)
══════════════════════════════════════════════════════ */
const BrowseDemandsMockup = () => {
  const marketPrices = [
    { crop: 'Tomatoes', range: '₦80–₦95/kg' },
    { crop: 'Maize',    range: '₦50–₦60/kg' },
    { crop: 'Pepper',   range: '₦110–₦130/kg' },
    { crop: 'Plantain', range: '₦55–₦70/kg' },
  ];
  const demands = [
    { crop: 'Tomatoes', buyer: 'Eko Hotels',     price: '₦85/kg',  remaining: '500 kg',   pct: 60 },
    { crop: 'Maize',    buyer: 'Radisson Blu',   price: '₦55/kg',  remaining: '1,000 kg', pct: 20 },
    { crop: 'Pepper',   buyer: 'Shoprite Lagos', price: '₦120/kg', remaining: '150 kg',   pct: 45 },
  ];

  return (
    <AppFrame>
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Page header */}
        <div style={{ padding: '14px 18px 8px' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: -0.3, fontFamily: "'Syne', sans-serif" }}>Browse Demands</p>
          <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Find buyers looking for produce you grow</p>
        </div>

        {/* Market prices ticker */}
        <div style={{ padding: '0 18px 8px' }}>
          <p style={{ fontSize: 8, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, fontFamily: "'Syne', sans-serif" }}>Market Prices</p>
          <div style={{ display: 'flex', gap: 5, overflow: 'hidden' }}>
            {marketPrices.map(mp => (
              <div key={mp.crop} style={{ border: '1px solid #f3f4f6', borderRadius: 8, padding: '3px 9px', fontSize: 10, whiteSpace: 'nowrap', background: '#fff' }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>{mp.crop}</span>
                <span style={{ color: '#9ca3af', marginLeft: 4 }}>{mp.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search + filter */}
        <div style={{ padding: '0 18px 8px', display: 'flex', gap: 7 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={10} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <div style={{ paddingLeft: 24, height: 28, background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#d1d5db' }}>Search by crop or buyer…</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', height: 28, background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 8, fontSize: 10, color: '#6b7280' }}>
            <SlidersHorizontal size={9} /> Filters
          </div>
        </div>

        {/* Demand rows */}
        <div style={{ borderTop: '1px solid #f3f4f6' }}>
          <div style={{ padding: '5px 18px 3px', fontSize: 9, color: '#9ca3af' }}>{demands.length} demands found</div>
          {demands.map(d => (
            <div key={d.crop} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 18px', borderTop: '1px solid #f9fafb' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif" }}>{d.crop[0]}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>{d.crop}</span>
                  <span style={{ background: '#eff6ff', color: '#3b82f6', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 999 }}>open</span>
                </div>
                <p style={{ fontSize: 9, color: '#9ca3af', marginBottom: 3 }}>{d.buyer} · {d.remaining} remaining</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 80, height: 3, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${d.pct}%`, height: '100%', background: GREEN, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 9, color: '#9ca3af' }}>{d.pct}% committed</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{d.price}</p>
                <div style={{ marginTop: 4, display: 'inline-flex', background: GREEN, color: '#111827', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>Commit</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppFrame>
  );
};

/* ══════════════════════════════════════════════════════
   MOCKUP 3 — Messages  (mirrors real Messages.tsx)
══════════════════════════════════════════════════════ */
const MessagesMockup = () => {
  const convos = [
    { crop: 'Tomatoes', party: 'Eko Hotels',    active: true  },
    { crop: 'Maize',    party: 'Radisson Blu',  active: false },
    { crop: 'Pepper',   party: 'Shoprite Lagos', active: false },
  ];
  const messages = [
    { text: 'When should I deliver the 200kg?',          mine: true  },
    { text: 'Every Tuesday before 8am. Wooden crates.',  mine: false },
    { text: 'Understood, will prepare accordingly.',     mine: true  },
  ];

  return (
    <AppFrame>
      <div style={{ display: 'flex', height: 340, fontFamily: "'Inter', sans-serif" }}>
        {/* Conversation list */}
        <div style={{ width: 200, borderRight: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>Conversations</p>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {convos.map(c => (
              <div key={c.crop} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px',
                borderBottom: '1px solid #f9fafb',
                background: c.active ? '#f9fafb' : 'transparent',
                borderLeft: `2px solid ${c.active ? GREEN : 'transparent'}`,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: c.active ? '#111827' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: c.active ? '#fff' : '#6b7280', fontFamily: "'Syne', sans-serif" }}>{c.crop[0]}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#111827', marginBottom: 1 }}>{c.crop}</p>
                  <p style={{ fontSize: 9, color: '#9ca3af' }}>{c.party}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
          <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>Tomatoes · Eko Hotels</p>
            <p style={{ fontSize: 9, color: '#9ca3af', marginTop: 1 }}>Commitment #1</p>
          </div>
          <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.mine ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: '7px 10px', borderRadius: 10, fontSize: 10, lineHeight: 1.45,
                  background: m.mine ? GREEN : '#fff',
                  color: m.mine ? '#111827' : '#374151',
                  border: m.mine ? 'none' : '1px solid #f3f4f6',
                  borderBottomRightRadius: m.mine ? 2 : 10,
                  borderBottomLeftRadius: m.mine ? 10 : 2,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          {/* Input bar */}
          <div style={{ padding: '10px 14px', background: '#fff', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 7 }}>
            <div style={{ flex: 1, height: 28, background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
              <span style={{ fontSize: 10, color: '#d1d5db' }}>Type a message…</span>
            </div>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Send size={11} style={{ color: '#111827' }} />
            </div>
          </div>
        </div>
      </div>
    </AppFrame>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
══════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="bg-white min-h-screen">

      {/* ════════════════════ NAV ════════════════════ */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

          <span style={{ fontFamily: "'Syne', sans-serif" }}
            className="text-base font-bold text-gray-900 tracking-tight">
            FarmLink
          </span>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link to="/register"
              className="inline-flex items-center text-sm font-semibold px-4 rounded-lg hover:opacity-90 transition-opacity text-gray-950"
              style={{ background: GREEN, height: 36 }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ════════════════════ HERO ════════════════════ */}
      <section style={{ background: DARK }} className="pt-14">
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-0 text-center">

          <div className="inline-flex items-center gap-2.5 border border-gray-800 rounded-full px-4 py-1.5 mb-8">
            <Dot />
            <span className="text-xs text-gray-400 font-medium">Fresh produce · Lagos &amp; beyond</span>
          </div>

          <h1 style={{ fontFamily: "'Syne', sans-serif", letterSpacing: -1.5, lineHeight: 1.08 }}
            className="text-5xl md:text-6xl text-white font-bold mb-5 max-w-3xl mx-auto">
            Supply is complex.<br />
            <span style={{ color: GREEN }}>FarmLink</span> fixes&nbsp;it.
          </h1>

          <p className="text-gray-400 text-base max-w-lg mx-auto leading-relaxed mb-3">
            Connect verified local farmers directly with buyers. Post needs, get committed supply — zero middlemen, full transparency.
          </p>

          <div className="flex items-center justify-center gap-2 mb-7">
            <div className="flex -space-x-2">
              {['#4ade80','#60a5fa','#f472b6','#fbbf24'].map((c, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: '2px solid #030712', zIndex: 4 - i }} />
              ))}
            </div>
            <span className="text-xs text-gray-500">Trusted by <span className="text-gray-300 font-semibold">200+ farmers &amp; buyers</span> across Lagos</span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-16">
            <Link to="/register"
              className="inline-flex items-center gap-2 font-semibold text-sm px-6 rounded-xl text-gray-950 transition-opacity hover:opacity-90"
              style={{ background: GREEN, height: 42 }}>
              Get started free <ArrowRight size={14} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 border border-gray-700 text-gray-300 font-medium text-sm px-6 rounded-xl hover:border-gray-500 hover:text-white transition-colors"
              style={{ height: 42 }}>
              Sign in
            </Link>
          </div>

          {/* Hero mockup */}
          <div className="max-w-4xl mx-auto">
            <BuyerDashboardMockup />
          </div>
        </div>
      </section>

      {/* ════════════════════ LOGOS STRIP ════════════════════ */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-6"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            Trusted by organizations across Lagos
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3">
            {['Eko Hotels', 'Shoprite Lagos', 'Radisson Blu', 'LUTH Hospital', 'Chicken Republic', 'UAM Catering'].map(t => (
              <span key={t} style={{ fontFamily: "'Syne', sans-serif" }}
                className="text-sm font-bold text-gray-300 tracking-wide">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ STATS ════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 py-20 scroll-mt-14" id="how-it-works">
        <div className="text-center mb-12">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4"
            style={{ fontFamily: "'Syne', sans-serif" }}>Why FarmLink</p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", letterSpacing: -0.5 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            A better supply chain,<br />by the numbers.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 border border-gray-100 rounded-2xl overflow-hidden">
          {[
            { n: '₦0',  label: 'Middleman fees',     sub: 'Every naira goes directly between farmer and buyer. No hidden cuts, ever.', accent: true  },
            { n: '94%', label: 'Fulfillment rate',    sub: 'Farmers who commit on FarmLink deliver. We track everything.',              accent: false },
            { n: '48h', label: 'First offer average', sub: 'Post a demand and receive your first farmer offer within two days.',         accent: false },
          ].map((s, i) => (
            <div key={s.label} className={`p-10 ${i < 2 ? 'md:border-r border-gray-100' : ''} ${i > 0 ? 'border-t md:border-t-0 border-gray-100' : ''}`}>
              <p style={{ fontFamily: "'Syne', sans-serif", color: s.accent ? GREEN : '#111827', letterSpacing: -1.5 }}
                className="text-5xl font-black tracking-tight mb-3">{s.n}</p>
              <p className="font-bold text-gray-900 mb-2">{s.label}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════ FOR BUYERS ════════════════════ */}
      <section style={{ background: DARK }} className="py-20 scroll-mt-14" id="for-buyers">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Copy */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-5"
                style={{ color: GREEN, fontFamily: "'Syne', sans-serif" }}>
                For Organizations &amp; Buyers
              </p>
              <h2 style={{ fontFamily: "'Syne', sans-serif", letterSpacing: -0.5, lineHeight: 1.15 }}
                className="text-3xl md:text-4xl text-white font-bold mb-5">
                Post once.<br />Get committed supply.
              </h2>
              <p className="text-gray-400 leading-relaxed mb-7 text-sm">
                Describe exactly what you need — crop, quantity, quality grade, delivery window. Verified farmers commit to your specs. Review offers, accept the best, and track fulfilment in real time.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  'No unreliable middlemen or market brokers',
                  'Full price transparency on every demand',
                  'Audit trail from commitment to delivery',
                  'Notify farmers of shortfalls automatically',
                ].map(t => (
                  <div key={t} className="flex items-center gap-3">
                    <CheckCircle size={14} style={{ color: GREEN }} className="shrink-0" />
                    <p className="text-sm text-gray-300">{t}</p>
                  </div>
                ))}
              </div>
              <Link to="/register"
                className="inline-flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-xl text-gray-950 hover:opacity-90 transition-opacity"
                style={{ background: GREEN }}>
                Post a demand <ArrowRight size={14} />
              </Link>
            </div>

            {/* Mockup: Browse demands from buyer POV (farmer offers tab) */}
            <div>
              <BrowseDemandsMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ FOR FARMERS ════════════════════ */}
      <section className="py-20 bg-white scroll-mt-14" id="for-farmers">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Mockup left */}
            <div className="order-2 lg:order-1">
              <MessagesMockup />
            </div>

            {/* Copy right */}
            <div className="order-1 lg:order-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-5 text-gray-400"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                For Farmers
              </p>
              <h2 style={{ fontFamily: "'Syne', sans-serif", letterSpacing: -0.5, lineHeight: 1.15 }}
                className="text-3xl md:text-4xl text-gray-900 font-bold mb-5">
                Sell what you grow,<br />directly.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-7 text-sm">
                Browse open demands from verified buyers. Commit to supply what you already grow — at a fair, transparent price — and track every step from field to payment.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { icon: ShoppingBag,  title: 'Know your buyer',   sub: 'Before harvest, not after.' },
                  { icon: BarChart2,    title: 'Fair pricing',       sub: 'Transparent ₦/kg on every demand.' },
                  { icon: CheckSquare,  title: 'Crop guidance',      sub: 'Best-practice tips per crop.' },
                  { icon: TrendingUp,   title: 'Track fulfilment',   sub: 'Full dashboard view.' },
                ].map(b => (
                  <div key={b.title} className="border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-all">
                    <b.icon size={13} style={{ color: GREEN, marginBottom: 5 }} />
                    <p className="text-sm font-bold text-gray-900 mb-0.5">{b.title}</p>
                    <p className="text-xs text-gray-400 leading-snug">{b.sub}</p>
                  </div>
                ))}
              </div>
              <Link to="/register"
                className="inline-flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-xl text-gray-950 hover:opacity-90 transition-opacity"
                style={{ background: GREEN }}>
                Join as a farmer <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ HOW IT WORKS ════════════════════ */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-4 text-gray-400"
              style={{ fontFamily: "'Syne', sans-serif" }}>Simple workflow</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", letterSpacing: -0.5 }}
              className="text-3xl md:text-4xl font-bold text-gray-900">
              How it works
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-14">
            <div>
              <div className="inline-flex items-center gap-2 mb-6 border border-gray-200 rounded-full px-3 py-1 bg-white">
                <ShoppingBag size={11} className="text-gray-500" />
                <span className="text-xs font-semibold text-gray-600">For Buyers</span>
              </div>
              <div className="space-y-6">
                {[
                  { n: '01', title: 'Post a demand',        sub: 'Describe the crop, qty, quality, price, and delivery window.'    },
                  { n: '02', title: 'Review farmer offers',  sub: 'Farmers commit supply. See their farm location and history.'   },
                  { n: '03', title: 'Accept & track',        sub: 'Accept the best offers. Monitor fulfilment in your dashboard.' },
                ].map((step, i) => (
                  <div key={step.n} className="flex gap-5">
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs"
                      style={{ fontFamily: "'Syne', sans-serif", background: i === 0 ? GREEN : '#f3f4f6', color: i === 0 ? '#111827' : '#6b7280' }}>
                      {step.n}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1 text-sm">{step.title}</p>
                      <p className="text-sm text-gray-400 leading-relaxed">{step.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 mb-6 border border-gray-200 rounded-full px-3 py-1 bg-white">
                <TrendingUp size={11} className="text-gray-500" />
                <span className="text-xs font-semibold text-gray-600">For Farmers</span>
              </div>
              <div className="space-y-6">
                {[
                  { n: '01', title: 'Browse demands',   sub: 'See open orders from verified buyers. Filter by crop and price.' },
                  { n: '02', title: 'Commit supply',    sub: 'Pledge qty you can deliver. Buyers review and accept.'           },
                  { n: '03', title: 'Deliver & earn',   sub: 'Fulfill on time. Build your reputation. Earn fairly.'           },
                ].map((step, i) => (
                  <div key={step.n} className="flex gap-5">
                    <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs"
                      style={{ fontFamily: "'Syne', sans-serif", background: i === 0 ? GREEN : '#f3f4f6', color: i === 0 ? '#111827' : '#6b7280' }}>
                      {step.n}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1 text-sm">{step.title}</p>
                      <p className="text-sm text-gray-400 leading-relaxed">{step.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ CTA ════════════════════ */}
      <section className="border-t border-gray-100 bg-white">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 border border-gray-100 rounded-full px-4 py-1.5 mb-7">
            <Dot color="#9ca3af" />
            <span className="text-xs text-gray-400 font-medium">No credit card required</span>
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", letterSpacing: -1, lineHeight: 1.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Ready to fix your<br />supply chain?
          </h2>
          <p className="text-gray-400 mb-8 text-base leading-relaxed max-w-sm mx-auto">
            Join farmers and buyers building a faster, fairer food supply chain across Nigeria.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/register"
              className="inline-flex items-center gap-2 font-semibold text-sm px-7 rounded-xl text-gray-950 hover:opacity-90 transition-opacity"
              style={{ background: GREEN, height: 44 }}>
              Create a free account <ArrowRight size={14} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-medium text-sm px-7 rounded-xl hover:border-gray-400 transition-colors"
              style={{ height: 44 }}>
              Sign in
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-5">
            Free forever for farmers · Buyers pay only on confirmed value
          </p>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer style={{ background: DARK }} className="border-t border-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <span style={{ fontFamily: "'Syne', sans-serif" }}
                className="text-base font-bold text-white tracking-tight block mb-3">FarmLink</span>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                Connecting verified Nigerian farmers with organizations that need reliable, transparent produce supply.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4"
                style={{ fontFamily: "'Syne', sans-serif" }}>Product</p>
              <div className="space-y-2.5">
                {[
                  { label: 'For Buyers',   href: '#for-buyers'   },
                  { label: 'For Farmers',  href: '#for-farmers'  },
                  { label: 'How it works', href: '#how-it-works' },
                  { label: 'Sign in',      href: '/login'        },
                  { label: 'Register',     href: '/register'     },
                ].map(l => (
                  l.href.startsWith('#')
                    ? <a key={l.label} href={l.href} className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">{l.label}</a>
                    : <Link key={l.label} to={l.href} className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4"
                style={{ fontFamily: "'Syne', sans-serif" }}>Legal</p>
              <div className="space-y-2.5">
                <Link to="/terms"   className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Terms of service</Link>
                <Link to="/privacy" className="block text-sm text-gray-500 hover:text-gray-300 transition-colors">Privacy policy</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-900 pt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-gray-600">© {new Date().getFullYear()} FarmLink. All rights reserved.</p>
            <p className="text-xs text-gray-600">Made for Nigerian farmers &amp; buyers.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
