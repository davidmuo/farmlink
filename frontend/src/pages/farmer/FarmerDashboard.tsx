import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, subDays, startOfDay } from 'date-fns';
import { Search, ArrowRight, ChevronRight, Banknote, Hourglass, Weight, Sprout, MapPin, Ruler, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Commitment } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import TrendChart from '../../components/TrendChart';
import StatTile from '../../components/StatTile';
import CropThumb from '../../components/CropThumb';
import Avatar from '../../components/Avatar';
import api from '../../lib/api';
import { greeting, firstName } from '../../lib/ui';

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

  const buyerName = (c: Commitment) => (c.demand as any)?.buyer?.businessName;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm text-gray-500">{format(new Date(), 'EEEE, d MMMM')}</p>
          <h1 className="page-title">
            {greeting()}, {firstName(user?.name)}
          </h1>
          <p className="page-subtitle">{user?.farmer?.farmLocation ? `${user.farmer.farmLocation} · ` : ''}Here's what's growing on FarmLink.</p>
        </div>
        <Link to="/farmer/demands" className="btn-lg btn-accent">
          <Search size={16} /> Browse demands
        </Link>
      </div>

      <div className="tabs mb-6">
        {([['overview', 'Overview'], ['commitments', 'My Commitments'], ['profile', 'Farm Profile']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`tab ${tab === key ? 'tab-active' : ''}`}>
            {label}
            {key === 'commitments' && pending.length > 0 && (
              <span className="tab-count">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Confirmed earnings" value={fmt(earnings)}                    sub={`${accepted.length} accepted`} icon={Banknote} />
        <StatTile label="Pipeline value"     value={fmt(pipeline)}                    sub={`${pending.length} pending`}   icon={Hourglass} />
        <StatTile label="Total committed"    value={`${totalKg.toLocaleString()} kg`} sub="all time"                      icon={Weight} />
        <StatTile label="Crops growing"      value={cropsGrown.length}                sub="crop types"                    icon={Sprout} />
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="stat-label mb-1.5">Earnings overview</p>
                  <p className="tabular text-2xl font-semibold tracking-tight text-gray-900">{fmt(earnings)}</p>
                </div>
                <span className="text-xs text-gray-500">Last 30 days, cumulative</span>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                {[
                  { dot: 'bg-forest-500',                           label: 'Confirmed', val: fmt(earnings) },
                  { dot: 'bg-gray-300',                             label: 'Pending',   val: fmt(pipeline) },
                  { dot: 'border-[1.5px] border-gray-300 bg-white', label: 'Rejected',  val: String(rejected.length) },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${l.dot}`} />
                    {l.label} <span className="ml-0.5 font-semibold text-gray-900">{l.val}</span>
                  </span>
                ))}
              </div>
              <TrendChart data={earningsSeries} height={250} showGrid />
            </div>

            <div className="card overflow-hidden">
              <div className="card-header">
                <p className="card-title">Your crops</p>
                <Link to="/farmer/demands" className="flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-900">
                  Find demands <ArrowRight size={13} />
                </Link>
              </div>
              {cropsGrown.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-gray-500">No crops on your profile yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-4">
                  {cropsGrown.map(c => (
                    <Link key={c} to="/farmer/demands"
                      className="group flex items-center gap-2.5 rounded-2xl border border-gray-100 p-2 pr-3 transition-all hover:border-gray-200 hover:shadow-card">
                      <CropThumb name={c} size={36} />
                      <span className="truncate text-sm font-medium text-gray-800">{c}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="card-header">
              <div>
                <p className="card-title">My commitments</p>
                <p className="card-sub">
                  {accepted.length} accepted · {pending.length} pending · {rejected.length} rejected
                </p>
              </div>
              <Link to="/farmer/commitments"
                className="flex items-center gap-1 text-xs font-semibold text-forest-700 transition-colors hover:text-forest-900">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            {commitments.length === 0 ? (
              <EmptyState bare icon={Search} title="No commitments yet"
                description="Browse open demands and commit to supply what you grow."
                action={<Link to="/farmer/demands" className="btn-md btn-accent"><Search size={14} /> Browse demands</Link>}
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {commitments.slice(0, 7).map(c => {
                  const val = c.committedQuantity * (c.demand?.pricePerUnit || 0);
                  return (
                    <div key={c.id} className="flex items-center gap-4 px-6 py-4">
                      <CropThumb name={c.demand?.crop?.cropName} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{c.demand?.crop?.cropName}</p>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="truncate text-xs text-gray-500">
                          {buyerName(c)} · {c.committedQuantity} kg
                          {c.demand?.deliveryEnd ? ` · Due ${format(new Date(c.demand.deliveryEnd), 'MMM d')}` : ''}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tabular text-sm font-semibold text-gray-900">{fmt(val)}</p>
                        <p className="mt-0.5 text-[11px] text-gray-500">{format(new Date(c.committedAt), 'MMM d')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'commitments' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <p className="card-title">All commitments</p>
              <p className="card-sub">{commitments.length} total</p>
            </div>
          </div>
          {commitments.length === 0 ? (
            <EmptyState bare icon={Search} title="No commitments yet" description="Browse open demands and commit to supply what you grow." />
          ) : (
            <div className="divide-y divide-gray-100">
              {commitments.map(c => {
                const val = c.committedQuantity * (c.demand?.pricePerUnit || 0);
                return (
                  <Link key={c.id} to={`/farmer/demands/${c.demandId}`}
                    className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50/80">
                    <CropThumb name={c.demand?.crop?.cropName} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{c.demand?.crop?.cropName}</p>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="truncate text-xs text-gray-500">
                        {buyerName(c)} · {c.committedQuantity} kg · ₦{c.demand?.pricePerUnit}/kg
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular text-sm font-semibold text-gray-900">{fmt(val)}</p>
                      <p className="text-[11px] text-gray-500">{format(new Date(c.committedAt), 'MMM d, yyyy')}</p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card overflow-hidden lg:col-span-2">
            <div className="flex items-center gap-4 border-b border-gray-100 p-6">
              <Avatar name={user?.name} size={64} rounded="2xl" />
              <div>
                <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">Farmer{user?.farmer?.farmLocation ? ` · ${user.farmer.farmLocation}` : ''}</p>
              </div>
            </div>
            <div className="grid gap-px bg-gray-100 sm:grid-cols-2">
              {[
                { icon: MapPin, label: 'Location',  value: user?.farmer?.farmLocation },
                { icon: Ruler,  label: 'Farm size', value: `${user?.farmer?.farmSize} hectares` },
                { icon: Phone,  label: 'Phone',     value: user?.phone || 'Not set' },
                { icon: Mail,   label: 'Email',     value: user?.email },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3 bg-white px-6 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500"><f.icon size={15} /></span>
                  <div className="min-w-0">
                    <p className="stat-label">{f.label}</p>
                    <p className="truncate text-sm font-semibold text-gray-900">{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 p-6">
              <p className="stat-label mb-3">Crops grown</p>
              <div className="flex flex-wrap gap-2">
                {cropsGrown.map(c => (
                  <span key={c} className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white pl-1 pr-3.5 text-sm text-gray-800">
                    <CropThumb name={c} size={28} rounded="full" /> {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              { label: 'Total',    value: commitments.length },
              { label: 'Accepted', value: accepted.length },
              { label: 'Pending',  value: pending.length },
            ].map(s => (
              <StatTile key={s.label} label={`${s.label} commitments`} value={s.value} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
