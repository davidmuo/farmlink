import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, subDays, startOfDay } from 'date-fns';
import { Search, ArrowRight, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Commitment } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import TrendChart from '../../components/TrendChart';
import api from '../../lib/api';

const GREEN = '#6DFF8A';

const fmt = (n: number) =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `₦${(n / 1_000).toFixed(0)}k`
  : `₦${n.toLocaleString()}`;

export default function FarmerDashboard() {
  const { user } = useAuth();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<'overview' | 'commitments' | 'profile'>('overview');

  useEffect(() => {
    api.get('/commitments').then(r => setCommitments(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const cropsGrown: string[] = user?.farmer?.cropsGrown ? JSON.parse(user.farmer.cropsGrown) : [];

  const pending  = commitments.filter(c => c.status === 'pending');
  const accepted = commitments.filter(c => c.status === 'accepted');
  const rejected = commitments.filter(c => c.status === 'rejected');
  const earnings = accepted.reduce((s, c) => s + c.committedQuantity * (c.demand?.pricePerUnit || 0), 0);
  const pipeline = pending.reduce((s, c)  => s + c.committedQuantity * (c.demand?.pricePerUnit || 0), 0);
  const totalKg  = commitments.reduce((s, c) => s + c.committedQuantity, 0);

  const earningsSeries = (() => {
    const today = startOfDay(new Date());
    const map: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) map[format(subDays(today, i), 'MMM d')] = 0;
    commitments.forEach(c => {
      const key = format(startOfDay(new Date(c.committedAt)), 'MMM d');
      if (key in map) map[key] += c.committedQuantity * (c.demand?.pricePerUnit || 0);
    });
    let running = 0;
    return Object.entries(map).map(([label, val]) => { running += val; return { label, value: running }; });
  })();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>


      <div className="flex gap-6 border-b border-gray-200 mb-8">
        {([['overview', 'Overview'], ['commitments', 'My Commitments'], ['profile', 'Farm Profile']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key ? 'text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
            style={tab === key ? { borderColor: GREEN } : {}}>
            {label}
            {key === 'commitments' && pending.length > 0 && (
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-gray-900"
                style={{ background: GREEN }}>{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 border border-gray-100 rounded-2xl bg-white mb-8 overflow-hidden">
        {[
          { label: 'Confirmed earnings', value: fmt(earnings),                    sub: `${accepted.length} accepted`,  green: true  },
          { label: 'Pipeline value',     value: fmt(pipeline),                    sub: `${pending.length} pending`,    green: false },
          { label: 'Total committed',    value: `${totalKg.toLocaleString()} kg`, sub: 'all time',                     green: false },
          { label: 'Crops growing',      value: cropsGrown.length,                sub: 'crop types',                   green: false },
        ].map(s => (
          <div key={s.label} className="p-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3"
              style={{ fontFamily: "'Syne', sans-serif" }}>{s.label}</p>
            <p className="text-2xl font-black tracking-tight leading-none"
              style={{ color: s.green ? GREEN : '#111827' }}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1"
                  style={{ fontFamily: "'Syne', sans-serif" }}>Earnings Overview</p>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{fmt(earnings)}</p>
              </div>
              <p className="text-xs text-gray-400">30-day cumulative</p>
            </div>
            <div className="flex items-center gap-5 mb-5">
              {[
                { dot: GREEN,         label: 'Confirmed', val: fmt(earnings)  },
                { dot: '#d1d5db',     label: 'Pending',   val: fmt(pipeline)  },
                { dot: 'transparent', label: 'Rejected',  val: String(rejected.length), border: true },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full shrink-0 inline-block"
                    style={{ background: l.dot, border: l.border ? '1.5px solid #d1d5db' : undefined }} />
                  {l.label} <span className="font-semibold text-gray-900 ml-0.5">{l.val}</span>
                </span>
              ))}
            </div>
            <TrendChart data={earningsSeries} height={160} showGrid color={GREEN} />
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div>
                <p className="font-bold text-gray-900">My Commitments</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {accepted.length} accepted · {pending.length} pending · {rejected.length} rejected
                </p>
              </div>
              <Link to="/farmer/commitments"
                className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {commitments.length === 0 ? (
              <EmptyState icon={Search} title="No commitments yet"
                description="Browse open demands and commit to supply what you grow."
                action={
                  <Link to="/farmer/demands"
                    className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl text-gray-900"
                    style={{ background: GREEN }}>
                    <Search size={14} /> Browse demands
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {commitments.slice(0, 7).map(c => {
                  const val = c.committedQuantity * (c.demand?.pricePerUnit || 0);
                  return (
                    <div key={c.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-gray-900 text-sm">{c.demand?.crop?.cropName}</p>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="text-xs text-gray-400">
                          {(c.demand as any)?.buyer?.businessName} · {c.committedQuantity} kg
                          {c.demand?.deliveryEnd ? ` · Due ${format(new Date(c.demand.deliveryEnd), 'MMM d')}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">{fmt(val)}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{format(new Date(c.committedAt), 'MMM d')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {cropsGrown.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <p className="font-bold text-gray-900">Your Crops</p>
                <Link to="/farmer/demands"
                  className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                  Find demands <ArrowRight size={12} />
                </Link>
              </div>
              <div className="p-5 flex flex-wrap gap-2">
                {cropsGrown.map(c => (
                  <Link key={c} to="/farmer/demands"
                    className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-gray-400 transition-colors">
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'commitments' && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <p className="font-bold text-gray-900">All Commitments</p>
            <p className="text-xs text-gray-400 mt-0.5">{commitments.length} total</p>
          </div>
          {commitments.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">No commitments yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {commitments.map(c => {
                const val = c.committedQuantity * (c.demand?.pricePerUnit || 0);
                return (
                  <Link key={c.id} to={`/farmer/demands/${c.demandId}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                    <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ fontFamily: "'Syne', sans-serif" }}>
                      {c.demand?.crop?.cropName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 text-sm">{c.demand?.crop?.cropName}</p>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {(c.demand as any)?.buyer?.businessName} · {c.committedQuantity} kg · ₦{c.demand?.pricePerUnit}/kg
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{fmt(val)}</p>
                      <p className="text-[11px] text-gray-400">{format(new Date(c.committedAt), 'MMM d, yyyy')}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <p className="font-bold text-gray-900">Farm Information</p>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-6">
              {[
                { label: 'Location',  value: user?.farmer?.farmLocation },
                { label: 'Farm size', value: `${user?.farmer?.farmSize} hectares` },
                { label: 'Phone',     value: user?.phone || 'Not set' },
                { label: 'Email',     value: user?.email },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5"
                    style={{ fontFamily: "'Syne', sans-serif" }}>{f.label}</p>
                  <p className="font-semibold text-gray-900 text-sm">{f.value}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 border-t border-gray-50 pt-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3"
                style={{ fontFamily: "'Syne', sans-serif" }}>Crops grown</p>
              <div className="flex flex-wrap gap-2">
                {cropsGrown.map(c => (
                  <span key={c} className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-xl text-sm">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',    value: commitments.length, green: false },
              { label: 'Accepted', value: accepted.length,    green: true  },
              { label: 'Pending',  value: pending.length,     green: false },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
                <p className="text-3xl font-black tracking-tight"
                  style={{ color: s.green ? GREEN : '#111827' }}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label} commitments</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
