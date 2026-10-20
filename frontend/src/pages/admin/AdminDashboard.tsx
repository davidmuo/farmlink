import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Users, ShoppingBag, CheckSquare, TrendingUp, ArrowRight, Activity, ChevronRight, BadgeCheck, Tag, AlertTriangle, Ban, Trash2, MapPin } from 'lucide-react';
import { AuditLog } from '../../types';
import Spinner from '../../components/Spinner';
import StatTile from '../../components/StatTile';
import Avatar from '../../components/Avatar';
import CropThumb from '../../components/CropThumb';
import EmptyState from '../../components/EmptyState';
import api from '../../lib/api';

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

const actionCfg: Record<string, { dot: string; label: string; badge: string }> = {
  CREATE_DEMAND:      { dot: 'bg-sky-500',     label: 'New Demand',    badge: 'badge-blue'   },
  CREATE_COMMITMENT:  { dot: 'bg-forest-500',  label: 'Commitment',    badge: 'badge-green'  },
  UPDATE_COMMITMENT:  { dot: 'bg-amber-500',   label: 'Status Update', badge: 'badge-amber'  },
  CREATE_FARM_RECORD: { dot: 'bg-violet-500',  label: 'Farm Record',   badge: 'badge-purple' },
};

function SectionHeading({ title, sub }: { icon?: typeof Users; title: string; sub: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500">{sub}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats]         = useState<Stats | null>(null);
  const [logs, setLogs]           = useState<AuditLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<'overview' | 'activity' | 'platform' | 'prices' | 'farmers' | 'disputes' | 'users'>('overview');

  const [marketPrices, setMarketPrices]   = useState<MarketPrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [editingPrices, setEditingPrices] = useState<Record<number, { priceMin: string; priceMax: string; unit: string }>>({});
  const [savingPrice, setSavingPrice]     = useState<number | null>(null);

  const [farmers, setFarmers]           = useState<FarmerUser[]>([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [togglingVerify, setTogglingVerify] = useState<number | null>(null);

  const [allUsers, setAllUsers]           = useState<any[]>([]);
  const [usersLoading, setUsersLoading]   = useState(false);
  const [togglingBan, setTogglingBan]     = useState<number | null>(null);
  const [deletingUser, setDeletingUser]   = useState<number | null>(null);

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
    Promise.all([api.get('/market-prices'), api.get('/crops')]).then(([p, c]) => {
      // Crops without a reference price are listed too (negative id = not priced yet), so one can be set
      const priced = new Set((p.data as MarketPrice[]).map(mp => mp.cropId));
      const unpriced: MarketPrice[] = (c.data as { id: number; cropName: string }[])
        .filter(crop => !priced.has(crop.id))
        .map(crop => ({ id: -crop.id, cropId: crop.id, priceMin: NaN, priceMax: NaN, unit: 'kg', crop: { cropName: crop.cropName } }));
      const all: MarketPrice[] = [...p.data, ...unpriced];
      setMarketPrices(all);
      const edits: Record<number, { priceMin: string; priceMax: string; unit: string }> = {};
      all.forEach(mp => {
        edits[mp.cropId] = {
          priceMin: isNaN(mp.priceMin) ? '' : String(mp.priceMin),
          priceMax: isNaN(mp.priceMax) ? '' : String(mp.priceMax),
          unit: mp.unit,
        };
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

  const loadAllUsers = () => {
    setUsersLoading(true);
    api.get('/admin/users').then(r => setAllUsers(r.data)).finally(() => setUsersLoading(false));
  };

  const toggleBan = async (user: any) => {
    setTogglingBan(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/ban`);
      loadAllUsers();
    } catch { toast.error('Failed to update user'); }
    finally { setTogglingBan(null); }
  };

  const deleteUser = async (user: any) => {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setDeletingUser(user.id);
    try {
      await api.delete(`/admin/users/${user.id}`);
      toast.success('User deleted');
      loadAllUsers();
    } catch { toast.error('Failed to delete user'); }
    finally { setDeletingUser(null); }
  };

  useEffect(() => {
    if (tab === 'prices') loadMarketPrices();
    if (tab === 'farmers') loadFarmers();
    if (tab === 'disputes') loadDisputes();
    if (tab === 'users') loadAllUsers();
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
    if (isNaN(parseFloat(edit.priceMin)) || isNaN(parseFloat(edit.priceMax))) {
      toast.error('Enter a minimum and maximum price');
      return;
    }
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

  const LogRow = ({ log, full = false }: { log: AuditLog; full?: boolean }) => {
    const cfg = actionCfg[log.action];
    return (
      <div className="flex items-start gap-3.5 px-6 py-4">
        <Avatar name={log.user?.name} size={36} />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{log.user?.name}</span>
            {full ? (
              <span className={cfg?.badge || 'badge-gray'}>
                <span className={`h-1.5 w-1.5 rounded-full ${cfg?.dot || 'bg-gray-400'}`} />
                {cfg?.label || log.action}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`h-1.5 w-1.5 rounded-full ${cfg?.dot || 'bg-gray-400'}`} />
                {cfg?.label || log.action.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <p className={`text-xs text-gray-500 ${full ? '' : 'truncate'}`}>{log.details}</p>
        </div>
        <p className="mt-0.5 shrink-0 whitespace-nowrap text-[11px] text-gray-400">
          {format(new Date(log.timestamp), full ? 'MMM d, yyyy · HH:mm' : 'MMM d, HH:mm')}
        </p>
      </div>
    );
  };

  const roleBadge = (role: string) => role === 'admin' ? 'badge-purple' : role === 'buyer' ? 'badge-blue' : 'badge-green';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform overview</h1>
          <p className="page-subtitle">Users, demands, prices and disputes across FarmLink.</p>
        </div>
      </div>

      <div className="tabs mb-6">
        {([
          ['overview', 'Overview'],
          ['activity', 'Activity Log'],
          ['platform', 'Platform'],
          ['prices',   'Market Prices'],
          ['farmers',  'Farmer Verification'],
          ['disputes', 'Disputes'],
          ['users',    'Users'],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`tab ${tab === key ? 'tab-active' : ''}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total users"       value={stats?.totalUsers || 0}       sub="registered accounts"   icon={Users} />
        <StatTile label="Total demands"     value={stats?.totalDemands || 0}     sub="buyer purchase orders" icon={ShoppingBag} />
        <StatTile label="Open demands"      value={stats?.openDemands || 0}      sub="awaiting supply"       icon={TrendingUp} />
        <StatTile label="Total commitments" value={stats?.totalCommitments || 0} sub="farmer supply offers"  icon={CheckSquare} />
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { to: '/admin/users',    icon: Users,       label: 'Manage Users',  desc: `${stats?.totalUsers || 0} registered` },
              { to: '/admin/audit',    icon: Activity,    label: 'Audit Logs',    desc: `${logs.length}+ recent actions` },
              { to: '/buyer/demands',  icon: ShoppingBag, label: 'Open Demands',  desc: `${stats?.openDemands || 0} active` },
            ].map(item => (
              <Link key={item.to} to={item.to} className="card-hover group flex items-center gap-3.5 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <item.icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
              </Link>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="card-header">
              <div>
                <p className="card-title">Recent activity</p>
                <p className="card-sub">{format(now, 'EEEE, MMM d · HH:mm')}</p>
              </div>
              <Link to="/admin/audit" className="flex items-center gap-1 text-xs font-semibold text-forest-700 transition-colors hover:text-forest-900">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            {logs.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">No activity yet</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {logs.slice(0, 8).map(log => <LogRow key={log.id} log={log} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <p className="card-title">Full activity log</p>
              <p className="card-sub">{logs.length} recent actions</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {logs.map(log => <LogRow key={log.id} log={log} full />)}
          </div>
        </div>
      )}

      {tab === 'platform' && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Users,       label: 'Total Users',       value: stats?.totalUsers || 0,       sub: 'Buyers, farmers, admins'  },
              { icon: ShoppingBag, label: 'Total Demands',     value: stats?.totalDemands || 0,     sub: 'All-time buyer orders'    },
              { icon: TrendingUp,  label: 'Open Demands',      value: stats?.openDemands || 0,      sub: 'Awaiting farmer supply'   },
              { icon: CheckSquare, label: 'Total Commitments', value: stats?.totalCommitments || 0, sub: 'All farmer supply offers' },
            ].map(s => (
              <div key={s.label} className="card flex items-center gap-5 p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <s.icon size={22} strokeWidth={1.75} />
                </span>
                <div>
                  <p className="tabular text-3xl font-semibold tracking-tight text-gray-900">{s.value}</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">{s.label}</p>
                  <p className="text-xs text-gray-500">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-6">
            <p className="card-title mb-5">Demand fill rate</p>
            <div className="space-y-4">
              {[
                { label: 'Open',            value: stats?.openDemands || 0,                                                     total: stats?.totalDemands || 1, color: 'bg-forest-500' },
                { label: 'In progress',     value: Math.max(0, (stats?.totalDemands || 0) - (stats?.openDemands || 0) - 2),     total: stats?.totalDemands || 1, color: 'bg-amber-400'  },
                { label: 'Closed/Filled',   value: 2,                                                                           total: stats?.totalDemands || 1, color: 'bg-gray-400'   },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-4">
                  <p className="w-28 shrink-0 text-sm text-gray-600">{row.label}</p>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div className={`h-full ${row.color} rounded-full transition-all`}
                      style={{ width: `${Math.min(100, (row.value / row.total) * 100)}%` }} />
                  </div>
                  <p className="tabular w-8 text-right text-sm font-semibold text-gray-900">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'prices' && (
        <div>
          <SectionHeading icon={Tag} title="Market prices" sub="Set reference prices per crop for the marketplace" />

          {pricesLoading ? <Spinner variant="inline" /> : marketPrices.length === 0 ? (
            <EmptyState icon={Tag} title="No market prices configured yet" />
          ) : (
            <div className="card overflow-hidden">
              <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] gap-4 border-b border-gray-100 bg-gray-50/80 px-6 py-3 md:grid">
                {['Crop', 'Min price (₦)', 'Max price (₦)', 'Unit', ''].map(h => (
                  <p key={h} className="stat-label">{h}</p>
                ))}
              </div>
              <div className="divide-y divide-gray-100">
                {marketPrices.map(mp => {
                  const edit = editingPrices[mp.cropId] || { priceMin: String(mp.priceMin), priceMax: String(mp.priceMax), unit: mp.unit };
                  return (
                    <div key={mp.id} className="grid grid-cols-2 items-center gap-3 px-6 py-3.5 md:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] md:gap-4">
                      <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                        <CropThumb name={mp.crop?.cropName} size={36} />
                        <p className="text-sm font-semibold text-gray-900">{mp.crop?.cropName}</p>
                        {mp.id < 0 && <span className="badge-gray">Not set</span>}
                      </div>
                      <input
                        type="number"
                        value={edit.priceMin}
                        onChange={e => setPriceField(mp.cropId, 'priceMin', e.target.value)}
                        className="input py-2"
                        min="0"
                        aria-label="Min price"
                      />
                      <input
                        type="number"
                        value={edit.priceMax}
                        onChange={e => setPriceField(mp.cropId, 'priceMax', e.target.value)}
                        className="input py-2"
                        min="0"
                        aria-label="Max price"
                      />
                      <input
                        type="text"
                        value={edit.unit}
                        onChange={e => setPriceField(mp.cropId, 'unit', e.target.value)}
                        className="input py-2"
                        placeholder="kg"
                        aria-label="Unit"
                      />
                      <button
                        onClick={() => savePrice(mp)}
                        disabled={savingPrice === mp.cropId}
                        className="btn-md btn-accent">
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

      {tab === 'disputes' && (
        <div>
          <SectionHeading icon={AlertTriangle} title="Dispute resolution" sub="Review and resolve disputes raised by farmers or buyers" />

          {disputesLoading ? <Spinner variant="inline" /> : disputes.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No disputes raised yet" description="When a farmer or buyer reports an issue, it shows up here." />
          ) : (
            <div className="space-y-3">
              {disputes.map(d => (
                <div key={d.id} className="card overflow-hidden">
                  <div className="flex items-start gap-4 p-5">
                    <Avatar name={d.raisedBy?.name} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{d.raisedBy?.name}</p>
                        <span className={`capitalize ${
                          d.status === 'open'      ? 'badge-red' :
                          d.status === 'resolved'  ? 'badge-green' :
                                                     'badge-gray'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                      <p className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                        <CropThumb name={d.commitment?.demand?.crop?.cropName} size={16} rounded="full" />
                        Commitment #{d.commitmentId} · {d.commitment?.demand?.crop?.cropName} ·{' '}
                        {d.commitment?.farmer?.user?.name} → {d.commitment?.demand?.buyer?.user?.name}
                      </p>
                      <p className="text-sm leading-relaxed text-gray-800">{d.reason}</p>
                      {d.resolution && (
                        <p className="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-xs italic text-gray-600">Resolution: {d.resolution}</p>
                      )}
                    </div>
                    <p className="shrink-0 whitespace-nowrap text-[11px] text-gray-400">
                      {format(new Date(d.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>

                  {d.status === 'open' && (
                    <div className="space-y-3 border-t border-gray-100 bg-gray-50/70 px-5 pb-5 pt-4">
                      <textarea
                        value={resolutionText[d.id] || ''}
                        onChange={e => setResolutionText(p => ({ ...p, [d.id]: e.target.value }))}
                        rows={2}
                        placeholder="Add a resolution note (optional)…"
                        className="input resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveDispute(d.id, 'resolved')}
                          disabled={resolvingDispute === d.id}
                          className="btn-md btn-accent">
                          {resolvingDispute === d.id ? '…' : 'Mark resolved'}
                        </button>
                        <button
                          onClick={() => handleResolveDispute(d.id, 'dismissed')}
                          disabled={resolvingDispute === d.id}
                          className="btn-md btn-secondary">
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

      {tab === 'users' && (
        <div>
          <SectionHeading icon={Users} title="User management" sub="Ban or remove accounts from the platform" />

          {usersLoading ? <Spinner variant="inline" /> : (
            <div className="card overflow-hidden">
              <div className="divide-y divide-gray-100">
                {allUsers.map(u => (
                  <div key={u.id} className={`flex items-center gap-4 px-5 py-4 sm:px-6 ${u.isBanned ? 'bg-red-50/40' : ''}`}>
                    <Avatar name={u.name} size={42} className={u.isBanned ? 'grayscale' : ''} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                        <span className={`capitalize ${roleBadge(u.role)}`}>{u.role}</span>
                        {u.isBanned && <span className="badge-red">Banned</span>}
                      </div>
                      <p className="truncate text-xs text-gray-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleBan(u)}
                        disabled={togglingBan === u.id || u.role === 'admin'}
                        title={u.role === 'admin' ? 'Cannot ban admins' : u.isBanned ? 'Unban user' : 'Ban user'}
                        className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors disabled:opacity-30 ${
                          u.isBanned ? 'bg-forest-50 text-forest-700 hover:bg-forest-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}>
                        <Ban size={13} /> <span className="hidden sm:inline">{u.isBanned ? 'Unban' : 'Ban'}</span>
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        disabled={deletingUser === u.id || u.role === 'admin'}
                        title={u.role === 'admin' ? 'Cannot delete admins' : 'Delete user'}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'farmers' && (
        <div>
          <SectionHeading icon={BadgeCheck} title="Farmer verification" sub="Verify farmers to build buyer trust on the platform" />

          {farmersLoading ? <Spinner variant="inline" /> : farmers.length === 0 ? (
            <EmptyState icon={BadgeCheck} title="No farmers registered yet" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {farmers.map(farmer => (
                <div key={farmer.id} className="card flex items-center gap-4 p-5">
                  <div className="relative shrink-0">
                    <Avatar name={farmer.name} size={52} />
                    {farmer.farmer.isVerified && (
                      <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-forest-700 text-white ring-2 ring-white">
                        <BadgeCheck size={13} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{farmer.name}</p>
                    <p className="truncate text-xs text-gray-500">{farmer.email}</p>
                    {farmer.farmer.farmLocation && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500"><MapPin size={11} />{farmer.farmer.farmLocation}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleVerify(farmer)}
                    disabled={togglingVerify === farmer.farmer.id}
                    className={farmer.farmer.isVerified ? 'btn-sm btn-secondary' : 'btn-sm btn-accent'}>
                    {togglingVerify === farmer.farmer.id
                      ? '…'
                      : farmer.farmer.isVerified ? 'Unverify' : 'Verify'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
