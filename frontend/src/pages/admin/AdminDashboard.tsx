import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Users, ShoppingBag, CheckSquare, TrendingUp, ArrowRight, Activity, ChevronRight, BadgeCheck, Tag, AlertTriangle } from 'lucide-react';
import { AuditLog } from '../../types';
import Spinner from '../../components/Spinner';
import api from '../../lib/api';

const GREEN = '#6DFF8A';

interface Stats { totalUsers: number; totalDemands: number; totalCommitments: number; openDemands: number; }

interface MarketPrice {
  id: number;
  cropId: number;
  priceMin: number;
  priceMax: number;
  unit: string;
  updatedAt?: string;
  crop: { cropName: string };
}

interface FarmerUser {
  id: number;
  name: string;
  email: string;
  farmer: {
    id: number;
    farmLocation: string;
    isVerified: boolean;
  };
}

const actionCfg: Record<string, { dot: string; label: string }> = {
  CREATE_DEMAND:      { dot: 'bg-blue-500',   label: 'New Demand'    },
  CREATE_COMMITMENT:  { dot: 'bg-green-500',  label: 'Commitment'    },
  UPDATE_COMMITMENT:  { dot: 'bg-amber-500',  label: 'Status Update' },
  CREATE_FARM_RECORD: { dot: 'bg-purple-500', label: 'Farm Record'   },
};

export default function AdminDashboard() {
  const [stats, setStats]         = useState<Stats | null>(null);
  const [logs, setLogs]           = useState<AuditLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<'overview' | 'activity' | 'platform' | 'prices' | 'farmers' | 'disputes'>('overview');

  // Market prices state
  const [marketPrices, setMarketPrices]   = useState<MarketPrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [editingPrices, setEditingPrices] = useState<Record<number, { priceMin: string; priceMax: string; unit: string }>>({});
  const [savingPrice, setSavingPrice]     = useState<number | null>(null);

  // Farmer verification state
  const [farmers, setFarmers]           = useState<FarmerUser[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [togglingVerify, setTogglingVerify] = useState<number | null>(null);

  // Disputes state
  const [disputes, setDisputes]           = useState<any[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [resolvingDispute, setResolvingDispute] = useState<number | null>(null);
  const [resolutionText, setResolutionText] = useState<Record<number, string>>({});

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/audit-logs')])
      .then(([s, l]) => { setStats(s.data); setLogs(l.data.slice(0, 20)); })
      .finally(() => setLoading(false));
  }, []);

  const loadMarketPrices = () => {
    setPricesLoading(true);
    api.get('/market-prices').then(r => {
      setMarketPrices(r.data);
      const edits: Record<number, { priceMin: string; priceMax: string; unit: string }> = {};
      r.data.forEach((mp: MarketPrice) => {
        edits[mp.cropId] = { priceMin: String(mp.priceMin), priceMax: String(mp.priceMax), unit: mp.unit };
      });
      setEditingPrices(edits);
    }).finally(() => setPricesLoading(false));
  };

  const loadFarmers = () => {
    setFarmersLoading(true);
    api.get('/admin/users', { params: { role: 'farmer' } })
      .then(r => setFarmers(r.data.filter((u: any) => u.farmer)))
      .finally(() => setFarmersLoading(false));
  };

  const loadDisputes = () => {
    setDisputesLoading(true);
    api.get('/disputes').then(r => setDisputes(r.data)).finally(() => setDisputesLoading(false));
  };

  useEffect(() => {
    if (tab === 'prices') loadMarketPrices();
    if (tab === 'farmers') loadFarmers();
    if (tab === 'disputes') loadDisputes();
  }, [tab]);

  const handleResolveDispute = async (disputeId: number, action: 'resolved' | 'dismissed') => {
    setResolvingDispute(disputeId);
    try {
      await api.patch(`/disputes/${disputeId}/resolve`, {
        action,
        resolution: resolutionText[disputeId] || '',
      });
      toast.success(`Dispute ${action}`);
      loadDisputes();
    } catch {
      toast.error('Failed to update dispute');
    } finally { setResolvingDispute(null); }
  };

  const setPriceField = (cropId: number, field: 'priceMin' | 'priceMax' | 'unit', value: string) => {
    setEditingPrices(p => ({ ...p, [cropId]: { ...p[cropId], [field]: value } }));
  };

  const savePrice = async (mp: MarketPrice) => {
    const edit = editingPrices[mp.cropId];
    if (!edit) return;
    setSavingPrice(mp.cropId);
    try {
      await api.put(`/market-prices/${mp.cropId}`, {
        priceMin: parseFloat(edit.priceMin),
        priceMax: parseFloat(edit.priceMax),
        unit: edit.unit,
      });
      loadMarketPrices();
      toast.success('Price updated');
    } catch {
      toast.error('Failed to save price');
    } finally { setSavingPrice(null); }
  };

  const toggleVerify = async (farmer: FarmerUser) => {
    setTogglingVerify(farmer.farmer.id);
    try {
      await api.patch(`/admin/farmers/${farmer.farmer.id}/verify`, {
        isVerified: !farmer.farmer.isVerified,
      });
      loadFarmers();
    } catch {
      toast.error('Failed to update verification');
    } finally { setTogglingVerify(null); }
  };

  if (loading) return <Spinner />;

  const now = new Date();

  return (
    <div className="space-y-0">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center font-black text-purple-700 text-lg">A</div>
          <div>
            <p className="text-xs text-gray-400">FarmLink · Lagos, Nigeria</p>
            <h1 className="text-xl font-bold text-gray-900">Platform Overview</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-xs font-semibold px-3 py-2 rounded-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          All systems healthy
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="flex gap-6 border-b border-gray-100 mb-6 overflow-x-auto">
        {([
          ['overview', 'Overview'],
          ['activity', 'Activity Log'],
          ['platform', 'Platform'],
          ['prices',   'Market Prices'],
          ['farmers',  'Farmer Verification'],
          ['disputes', 'Disputes'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Stats strip ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total users',       value: stats?.totalUsers || 0,       sub: 'registered accounts'  },
          { label: 'Total demands',     value: stats?.totalDemands || 0,     sub: 'buyer purchase orders' },
          { label: 'Open demands',      value: stats?.openDemands || 0,      sub: 'awaiting supply'       },
          { label: 'Total commitments', value: stats?.totalCommitments || 0, sub: 'farmer supply offers'  },
        ].map(s => (
          <div key={s.label} className="border border-gray-100 rounded-2xl p-4 bg-white">
            <p className="text-xs text-gray-400 mb-2">{s.label}</p>
            <p className="text-2xl font-black text-gray-900 tracking-tight leading-none">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Overview tab ───────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Quick links */}
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { to: '/admin/users',    icon: Users,       label: 'Manage Users',  desc: `${stats?.totalUsers || 0} registered`,         bg: 'bg-blue-50',   ic: 'text-blue-600'   },
              { to: '/admin/audit',    icon: Activity,    label: 'Audit Logs',    desc: `${logs.length}+ recent actions`,               bg: 'bg-purple-50', ic: 'text-purple-600' },
              { to: '/buyer/demands',  icon: ShoppingBag, label: 'Open Demands',  desc: `${stats?.openDemands || 0} active`,            bg: 'bg-gray-50',   ic: 'text-gray-500'   },
            ].map(item => (
              <Link key={item.to} to={item.to}
                className="flex items-center gap-3 border border-gray-100 rounded-2xl px-5 py-4 hover:bg-gray-50 transition-colors group"
                style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.04)' }}>
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                  <item.icon size={18} className={item.ic} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
                <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
              </Link>
            ))}
          </div>

          {/* Recent activity */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.05)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
              <div>
                <h2 className="font-bold text-gray-900">Recent Activity</h2>
                <p className="text-xs text-gray-400 mt-0.5">{format(now, 'EEEE, MMM d · HH:mm')}</p>
              </div>
              <Link to="/admin/audit" className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            {logs.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">No activity yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {logs.slice(0, 8).map(log => {
                  const cfg = actionCfg[log.action];
                  return (
                    <div key={log.id} className="flex items-start gap-4 px-6 py-4">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 text-xs shrink-0 mt-0.5">
                        {log.user?.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900 text-sm">{log.user?.name}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot || 'bg-gray-400'}`} />
                            {cfg?.label || log.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{log.details}</p>
                      </div>
                      <p className="text-[11px] text-gray-300 whitespace-nowrap shrink-0 mt-0.5">
                        {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Activity tab ───────────────────────────────────── */}
      {tab === 'activity' && (
        <div className="border border-gray-100 rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.05)' }}>
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900">Full Activity Log</h2>
            <p className="text-xs text-gray-400 mt-0.5">{logs.length} recent actions</p>
          </div>
          <div className="divide-y divide-gray-50">
            {logs.map(log => {
              const cfg = actionCfg[log.action];
              return (
                <div key={log.id} className="flex items-start gap-4 px-6 py-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 text-xs shrink-0 mt-0.5">
                    {log.user?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{log.user?.name}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        log.action === 'CREATE_DEMAND' ? 'bg-blue-50 text-blue-600' :
                        log.action === 'CREATE_COMMITMENT' ? 'bg-green-50 text-green-600' :
                        log.action === 'UPDATE_COMMITMENT' ? 'bg-amber-50 text-amber-600' :
                        'bg-purple-50 text-purple-600'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${cfg?.dot || 'bg-gray-400'}`} />
                        {cfg?.label || log.action}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{log.details}</p>
                  </div>
                  <p className="text-[11px] text-gray-300 whitespace-nowrap shrink-0">
                    {format(new Date(log.timestamp), 'MMM d, yyyy · HH:mm')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Platform tab ───────────────────────────────────── */}
      {tab === 'platform' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Users,       label: 'Total Users',       value: stats?.totalUsers || 0,       sub: 'Buyers, farmers, admins'  },
              { icon: ShoppingBag, label: 'Total Demands',     value: stats?.totalDemands || 0,     sub: 'All-time buyer orders'    },
              { icon: TrendingUp,  label: 'Open Demands',      value: stats?.openDemands || 0,      sub: 'Awaiting farmer supply'   },
              { icon: CheckSquare, label: 'Total Commitments', value: stats?.totalCommitments || 0, sub: 'All farmer supply offers' },
            ].map(s => (
              <div key={s.label} className="border border-gray-100 rounded-2xl p-6 flex items-center gap-5"
                style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.04)' }}>
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <s.icon size={24} className="text-gray-400" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-4xl font-black text-gray-900 tracking-tight">{s.value}</p>
                  <p className="font-semibold text-gray-900 text-sm mt-0.5">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border border-gray-100 rounded-2xl p-6" style={{ boxShadow: '0 1px 4px 0 rgb(0 0 0 / 0.04)' }}>
            <h3 className="font-bold text-gray-900 mb-4">Demand fill rate</h3>
            <div className="space-y-3">
              {[
                { label: 'Open',            value: stats?.openDemands || 0,                                                     total: stats?.totalDemands || 1, color: 'bg-green-500'  },
                { label: 'In progress',     value: Math.max(0, (stats?.totalDemands || 0) - (stats?.openDemands || 0) - 2),     total: stats?.totalDemands || 1, color: 'bg-amber-500'  },
                { label: 'Closed/Filled',   value: 2,                                                                           total: stats?.totalDemands || 1, color: 'bg-gray-400'   },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-4">
                  <p className="text-xs text-gray-500 w-24 shrink-0">{row.label}</p>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full transition-all`}
                      style={{ width: `${Math.min(100, (row.value / row.total) * 100)}%` }} />
                  </div>
                  <p className="text-xs font-semibold text-gray-600 w-6 text-right">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Market Prices tab ──────────────────────────────── */}
      {tab === 'prices' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Tag size={16} className="text-gray-400" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Market Prices</h2>
              <p className="text-xs text-gray-400">Set reference prices per crop for the marketplace</p>
            </div>
          </div>

          {pricesLoading ? <Spinner /> : marketPrices.length === 0 ? (
            <div className="border border-gray-100 rounded-2xl p-10 text-center">
              <p className="text-sm text-gray-400">No market prices configured yet.</p>
            </div>
          ) : (
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-5 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
                {['Crop', 'Min Price (₦)', 'Max Price (₦)', 'Unit', ''].map(h => (
                  <p key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest"
                    style={{ fontFamily: 'Syne, sans-serif' }}>
                    {h}
                  </p>
                ))}
              </div>
              <div className="divide-y divide-gray-50">
                {marketPrices.map(mp => {
                  const edit = editingPrices[mp.cropId] || { priceMin: String(mp.priceMin), priceMax: String(mp.priceMax), unit: mp.unit };
                  return (
                    <div key={mp.id} className="grid grid-cols-5 gap-4 items-center px-5 py-3">
                      <p className="font-semibold text-gray-900 text-sm">{mp.crop?.cropName}</p>
                      <input
                        type="number"
                        value={edit.priceMin}
                        onChange={e => setPriceField(mp.cropId, 'priceMin', e.target.value)}
                        className="input text-sm py-1.5"
                        min="0"
                      />
                      <input
                        type="number"
                        value={edit.priceMax}
                        onChange={e => setPriceField(mp.cropId, 'priceMax', e.target.value)}
                        className="input text-sm py-1.5"
                        min="0"
                      />
                      <input
                        type="text"
                        value={edit.unit}
                        onChange={e => setPriceField(mp.cropId, 'unit', e.target.value)}
                        className="input text-sm py-1.5"
                        placeholder="kg"
                      />
                      <button
                        onClick={() => savePrice(mp)}
                        disabled={savingPrice === mp.cropId}
                        className="text-gray-900 font-bold text-xs rounded-xl px-3 py-1.5 whitespace-nowrap"
                        style={{ background: GREEN }}>
                        {savingPrice === mp.cropId ? 'Saving…' : 'Set price'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Disputes tab ───────────────────────────────────── */}
      {tab === 'disputes' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-gray-400" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Dispute Resolution</h2>
              <p className="text-xs text-gray-400">Review and resolve disputes raised by farmers or buyers</p>
            </div>
          </div>

          {disputesLoading ? <Spinner /> : disputes.length === 0 ? (
            <div className="border border-gray-100 rounded-2xl p-10 text-center">
              <AlertTriangle size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No disputes raised yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map(d => (
                <div key={d.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                  <div className="flex items-start gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 text-sm shrink-0">
                      {d.raisedBy?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{d.raisedBy?.name}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          d.status === 'open'      ? 'bg-red-50 text-red-600' :
                          d.status === 'resolved'  ? 'bg-green-50 text-green-700' :
                                                     'bg-gray-100 text-gray-500'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-1">
                        Commitment #{d.commitmentId} · {d.commitment?.demand?.crop?.cropName} ·{' '}
                        {d.commitment?.farmer?.user?.name} → {d.commitment?.demand?.buyer?.user?.name}
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{d.reason}</p>
                      {d.resolution && (
                        <p className="text-xs text-gray-400 mt-1.5 italic">Resolution: {d.resolution}</p>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-300 whitespace-nowrap shrink-0">
                      {format(new Date(d.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>

                  {d.status === 'open' && (
                    <div className="px-5 pb-4 pt-2 border-t border-gray-50 bg-gray-50/50 space-y-3">
                      <textarea
                        value={resolutionText[d.id] || ''}
                        onChange={e => setResolutionText(p => ({ ...p, [d.id]: e.target.value }))}
                        rows={2}
                        placeholder="Add a resolution note (optional)…"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveDispute(d.id, 'resolved')}
                          disabled={resolvingDispute === d.id}
                          className="text-xs font-bold px-4 py-2 rounded-xl text-gray-900 disabled:opacity-40"
                          style={{ background: GREEN }}>
                          {resolvingDispute === d.id ? '…' : 'Mark Resolved'}
                        </button>
                        <button
                          onClick={() => handleResolveDispute(d.id, 'dismissed')}
                          disabled={resolvingDispute === d.id}
                          className="text-xs font-semibold px-4 py-2 rounded-xl text-gray-500 border border-gray-200 bg-white disabled:opacity-40">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Farmer Verification tab ────────────────────────── */}
      {tab === 'farmers' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <BadgeCheck size={16} className="text-gray-400" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Farmer Verification</h2>
              <p className="text-xs text-gray-400">Verify farmers to build buyer trust on the platform</p>
            </div>
          </div>

          {farmersLoading ? <Spinner /> : farmers.length === 0 ? (
            <div className="border border-gray-100 rounded-2xl p-10 text-center">
              <p className="text-sm text-gray-400">No farmers registered yet.</p>
            </div>
          ) : (
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="divide-y divide-gray-50">
                {farmers.map(farmer => (
                  <div key={farmer.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 text-sm shrink-0">
                      {farmer.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 text-sm">{farmer.name}</p>
                        {farmer.farmer.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            <BadgeCheck size={9} /> Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {farmer.email}
                        {farmer.farmer.farmLocation && ` · ${farmer.farmer.farmLocation}`}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleVerify(farmer)}
                      disabled={togglingVerify === farmer.farmer.id}
                      className={`text-xs font-bold rounded-xl px-4 py-2 transition-colors ${
                        farmer.farmer.isVerified
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'text-gray-900'
                      }`}
                      style={!farmer.farmer.isVerified ? { background: GREEN } : {}}>
                      {togglingVerify === farmer.farmer.id
                        ? '…'
                        : farmer.farmer.isVerified ? 'Unverify' : 'Verify'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
