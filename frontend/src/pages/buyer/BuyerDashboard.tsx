import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, subDays, startOfDay } from 'date-fns';
import { PlusCircle, ArrowRight, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Demand, Commitment } from '../../types';
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

export default function BuyerDashboard() {
  const { user: _user } = useAuth();
  const [demands, setDemands]         = useState<Demand[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<'overview' | 'demands' | 'offers'>('overview');

  useEffect(() => {
    Promise.all([
      api.get('/demands', { params: { mine: true } }),
      api.get('/commitments'),
    ]).then(([d, c]) => { setDemands(d.data); setCommitments(c.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const open           = demands.filter(d => d.status === 'open').length;
  const inProgress     = demands.filter(d => d.status === 'partially_filled').length;
  const pending        = commitments.filter(c => c.status === 'pending').length;
  const accepted       = commitments.filter(c => c.status === 'accepted').length;
  const confirmedValue = commitments
    .filter(c => c.status === 'accepted')
    .reduce((s, c) => s + c.committedQuantity * (c.demand?.pricePerUnit || 0), 0);
  const totalValue = demands.reduce((s, d) => s + d.quantity * d.pricePerUnit, 0);

  const valueSeries = (() => {
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


      <div className="flex items-center gap-6 border-b border-gray-200 mb-8">
        {([['overview', 'Overview'], ['demands', 'My Demands'], ['offers', 'Farmer Offers']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`relative pb-3 text-sm font-medium transition-colors ${
              tab === key ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {tab === key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                style={{ height: 3, width: 24, background: GREEN }} />
            )}
            {label}
            {key === 'offers' && pending > 0 && (
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-gray-900"
                style={{ background: GREEN }}>{pending}</span>
            )}
          </button>
        ))}
        <div className="ml-auto pb-3">
          <Link to="/buyer/demands/new"
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl text-gray-900 transition-opacity hover:opacity-80"
            style={{ background: GREEN }}>
            <PlusCircle size={12} /> Post demand
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 border border-gray-100 rounded-2xl bg-white mb-8 overflow-hidden">
        {[
          { label: 'Open demands',    value: open,                green: false, sub: 'awaiting supply'    },
          { label: 'In progress',     value: inProgress,          green: false, sub: 'being filled'       },
          { label: 'Confirmed value', value: fmt(confirmedValue), green: true,  sub: 'accepted offers'    },
          { label: 'Pending offers',  value: pending,             green: false, sub: 'awaiting review'    },
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

      {pending > 0 && tab === 'overview' && (
        <div className="flex items-center justify-between border border-gray-100 bg-white rounded-2xl px-5 py-4 mb-6">
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {pending} farmer offer{pending > 1 ? 's' : ''} waiting for review
            </p>
            <p className="text-gray-400 text-xs mt-0.5">Accept or reject to progress your supply chain</p>
          </div>
          <Link to="/buyer/commitments"
            className="flex items-center gap-1.5 font-bold text-xs px-4 py-2 rounded-xl text-gray-900 shrink-0 hover:opacity-90 transition-opacity"
            style={{ background: GREEN }}>
            Review now <ChevronRight size={13} />
          </Link>
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-5">

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1"
                  style={{ fontFamily: "'Syne', sans-serif" }}>Procurement Overview</p>
                <p className="text-2xl font-black text-gray-900 tracking-tight">{fmt(totalValue)}</p>
              </div>
              <p className="text-xs text-gray-400">30-day cumulative</p>
            </div>
            <div className="flex items-center gap-5 mb-5">
              {[
                { dot: GREEN,     label: 'Confirmed', val: fmt(confirmedValue) },
                { dot: '#d1d5db', label: 'Pending',   val: String(pending) },
                { dot: '#f3f4f6', label: 'Open demands', val: String(open), border: true },
              ].map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full shrink-0 inline-block"
                    style={{ background: l.dot, border: l.border ? '1.5px solid #d1d5db' : undefined }} />
                  {l.label} <span className="font-semibold text-gray-900 ml-0.5">{l.val}</span>
                </span>
              ))}
            </div>
            <TrendChart data={valueSeries} height={160} showGrid color={GREEN} />
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div>
                <p className="font-bold text-gray-900">Demand Pipeline</p>
                <p className="text-xs text-gray-400 mt-0.5">Total value: {fmt(totalValue)}</p>
              </div>
              <Link to="/buyer/demands"
                className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {demands.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-400 text-sm mb-4">No demands yet. Post your first to get farmer offers.</p>
                <Link to="/buyer/demands/new"
                  className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl text-gray-900"
                  style={{ background: GREEN }}>
                  <PlusCircle size={14} /> Post demand
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {demands.slice(0, 6).map(d => {
                  const committed = d.commitments
                    ?.filter(c => !['cancelled', 'rejected'].includes(c.status))
                    .reduce((s, c) => s + c.committedQuantity, 0) || 0;
                  const pct = Math.min(100, Math.round((committed / d.quantity) * 100));
                  return (
                    <Link key={d.id} to={`/buyer/demands/${d.id}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="font-semibold text-gray-900 text-sm">{d.crop?.cropName}</p>
                          <StatusBadge status={d.status} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-28 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: GREEN }} />
                          </div>
                          <span className="text-xs text-gray-400">{pct}% filled</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 w-20">
                        <p className="text-sm font-bold text-gray-900 tabular-nums">{fmt(d.quantity * d.pricePerUnit)}</p>
                        <p className="text-xs text-gray-400">{d.commitments?.length || 0} offer{d.commitments?.length !== 1 ? 's' : ''}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {commitments.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div>
                  <p className="font-bold text-gray-900">Recent Farmer Offers</p>
                  <p className="text-xs text-gray-400 mt-0.5">{accepted} accepted · {pending} pending</p>
                </div>
                <Link to="/buyer/commitments"
                  className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {commitments.slice(0, 5).map((c: any) => {
                  const val = c.committedQuantity * (c.demand?.pricePerUnit || 0);
                  return (
                    <div key={c.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-xs shrink-0"
                        style={{ fontFamily: "'Syne', sans-serif" }}>
                        {c.farmer?.user?.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{c.farmer?.user?.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.demand?.crop?.cropName} · {c.committedQuantity} kg · {c.farmer?.farmLocation}
                        </p>
                      </div>
                      <div className="text-right shrink-0 w-20">
                        <p className="text-sm font-bold text-gray-900 tabular-nums">{fmt(val)}</p>
                        <div className="mt-1"><StatusBadge status={c.status} /></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'demands' && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <p className="font-bold text-gray-900">All Demands ({demands.length})</p>
            <Link to="/buyer/demands/new"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-gray-900"
              style={{ background: GREEN }}>
              <PlusCircle size={12} /> New
            </Link>
          </div>
          {demands.length === 0 ? (
            <EmptyState icon={PlusCircle} title="No demands yet" description="Post your first demand to get farmer offers." />
          ) : (
            <div className="divide-y divide-gray-50">
              {demands.map(d => {
                const committed = d.commitments
                  ?.filter(c => !['cancelled', 'rejected'].includes(c.status))
                  .reduce((s, c) => s + c.committedQuantity, 0) || 0;
                const pct = Math.min(100, Math.round((committed / d.quantity) * 100));
                return (
                  <Link key={d.id} to={`/buyer/demands/${d.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                    <div className="w-8 h-8 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 text-white text-xs font-bold"
                      style={{ fontFamily: "'Syne', sans-serif" }}>
                      {d.crop?.cropName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm">{d.crop?.cropName}</p>
                        <StatusBadge status={d.status} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {d.quantity.toLocaleString()} kg · ₦{d.pricePerUnit}/kg · Due {format(new Date(d.deliveryEnd), 'MMM d')}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: GREEN }} />
                        </div>
                        <span className="text-[11px] text-gray-400">{pct}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 w-20">
                      <p className="text-sm font-bold text-gray-900 tabular-nums">{fmt(d.quantity * d.pricePerUnit)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{d.commitments?.length || 0} offers</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'offers' && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <p className="font-bold text-gray-900">Farmer Offers ({commitments.length})</p>
            <p className="text-xs text-gray-400 mt-0.5">{pending} pending · {accepted} accepted</p>
          </div>
          {commitments.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">No farmer offers yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {commitments.map((c: any) => {
                const val = c.committedQuantity * (c.demand?.pricePerUnit || 0);
                return (
                  <div key={c.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm shrink-0"
                      style={{ fontFamily: "'Syne', sans-serif" }}>
                      {c.farmer?.user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{c.farmer?.user?.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.demand?.crop?.cropName} · {c.committedQuantity} kg{c.farmer?.farmLocation ? ` · ${c.farmer.farmLocation}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 w-20">
                      <p className="text-sm font-bold text-gray-900 tabular-nums">{fmt(val)}</p>
                      <div className="mt-1"><StatusBadge status={c.status} /></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
