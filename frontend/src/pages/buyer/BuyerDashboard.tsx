import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, subDays, startOfDay } from 'date-fns';
import { PlusCircle, ArrowRight, ChevronRight, ShoppingBag, Clock, Banknote, Inbox, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Demand, Commitment } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import TrendChart from '../../components/TrendChart';
import StatTile from '../../components/StatTile';
import Avatar from '../../components/Avatar';
import CropThumb from '../../components/CropThumb';
import api from '../../lib/api';
import { greeting, firstName } from '../../lib/ui';

const fmt = (n: number) =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `₦${(n / 1_000).toFixed(0)}k`
  : `₦${n.toLocaleString()}`;

export default function BuyerDashboard() {
  const { user } = useAuth();
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

  const pendingFarmers = commitments.filter(c => c.status === 'pending').slice(0, 4);

  const DemandRow = ({ d, compact = false }: { d: Demand; compact?: boolean }) => {
    const committed = d.commitments
      ?.filter(c => !['cancelled', 'rejected'].includes(c.status))
      .reduce((s, c) => s + c.committedQuantity, 0) || 0;
    const pct = Math.min(100, Math.round((committed / d.quantity) * 100));
    return (
      <Link to={`/buyer/demands/${d.id}`}
        className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50/80">
        <CropThumb name={d.crop?.cropName} size={44} />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">{d.crop?.cropName}</p>
            <StatusBadge status={d.status} />
          </div>
          {!compact && (
            <p className="text-xs text-gray-500">
              {d.quantity.toLocaleString()} kg · ₦{d.pricePerUnit}/kg · Due {format(new Date(d.deliveryEnd), 'MMM d')}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2.5">
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-100 sm:w-40">
              <div className="h-full rounded-full bg-forest-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500">{pct}% filled</span>
          </div>
        </div>
        <div className="w-20 shrink-0 text-right">
          <p className="tabular text-sm font-semibold text-gray-900">{fmt(d.quantity * d.pricePerUnit)}</p>
          <p className="mt-0.5 text-xs text-gray-500">{d.commitments?.length || 0} offer{d.commitments?.length !== 1 ? 's' : ''}</p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
      </Link>
    );
  };

  const OfferRow = ({ c }: { c: any }) => {
    const val = c.committedQuantity * (c.demand?.pricePerUnit || 0);
    return (
      <div className="flex items-center gap-3.5 px-6 py-3.5">
        <Avatar name={c.farmer?.user?.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{c.farmer?.user?.name}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {c.demand?.crop?.cropName} · {c.committedQuantity} kg{c.farmer?.farmLocation ? ` · ${c.farmer.farmLocation}` : ''}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="tabular text-sm font-semibold text-gray-900">{fmt(val)}</p>
          <div className="mt-1"><StatusBadge status={c.status} /></div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-sm text-gray-500">{format(new Date(), 'EEEE, d MMMM')}</p>
          <h1 className="page-title">
            {greeting()}, {firstName(user?.name)}
          </h1>
          <p className="page-subtitle">{user?.buyer?.businessName ? `${user.buyer.businessName} · ` : ''}Here's how your sourcing is going.</p>
        </div>
        <Link to="/buyer/demands/new" className="btn-lg btn-accent">
          <PlusCircle size={16} /> Post demand
        </Link>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        {([['overview', 'Overview'], ['demands', 'My Demands'], ['offers', 'Farmer Offers']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`tab ${tab === key ? 'tab-active' : ''}`}>
            {label}
            {key === 'offers' && pending > 0 && (
              <span className="tab-count">{pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Open demands"    value={open}                icon={ShoppingBag} sub="awaiting supply" />
        <StatTile label="In progress"     value={inProgress}          icon={Clock}       sub="being filled" />
        <StatTile label="Confirmed value" value={fmt(confirmedValue)} icon={Banknote}    sub="accepted offers" />
        <StatTile label="Pending offers"  value={pending}             icon={Inbox}       sub="awaiting review" />
      </div>

      {pending > 0 && tab === 'overview' && (
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <div className="flex -space-x-2">
            {pendingFarmers.map((c: any) => <Avatar key={c.id} name={c.farmer?.user?.name} size={34} className="ring-2 ring-amber-50" />)}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">
              {pending} farmer offer{pending > 1 ? 's' : ''} waiting for review
            </p>
            <p className="mt-0.5 text-sm text-gray-600">Accept or reject them to move your orders forward.</p>
          </div>
          <Link to="/buyer/commitments" className="btn-md btn-primary shrink-0">
            Review now <ChevronRight size={15} />
          </Link>
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="stat-label mb-1.5">Procurement overview</p>
                  <p className="tabular text-2xl font-semibold tracking-tight text-gray-900">{fmt(totalValue)}</p>
                </div>
                <span className="text-xs text-gray-500">Last 30 days, cumulative</span>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                {[
                  { dot: 'bg-forest-500',                       label: 'Confirmed',    val: fmt(confirmedValue) },
                  { dot: 'bg-gray-300',                         label: 'Pending',      val: String(pending) },
                  { dot: 'border-[1.5px] border-gray-300 bg-white', label: 'Open demands', val: String(open) },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${l.dot}`} />
                    {l.label} <span className="ml-0.5 font-semibold text-gray-900">{l.val}</span>
                  </span>
                ))}
              </div>
              <TrendChart data={valueSeries} height={250} showGrid />
            </div>

            <div className="card overflow-hidden">
              <div className="card-header">
                <div>
                  <p className="card-title">Recent farmer offers</p>
                  <p className="card-sub">{accepted} accepted · {pending} pending</p>
                </div>
                <Link to="/buyer/commitments" className="text-xs font-semibold text-forest-700 hover:text-forest-900">View all</Link>
              </div>
              {commitments.length === 0 ? (
                <div className="px-6 py-14 text-center text-sm text-gray-500">No farmer offers yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {commitments.slice(0, 5).map((c: any) => <OfferRow key={c.id} c={c} />)}
                </div>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="card-header">
              <div>
                <p className="card-title">Demand pipeline</p>
                <p className="card-sub">Total value: {fmt(totalValue)}</p>
              </div>
              <Link to="/buyer/demands"
                className="flex items-center gap-1 text-xs font-semibold text-forest-700 transition-colors hover:text-forest-900">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            {demands.length === 0 ? (
              <EmptyState bare icon={PlusCircle} title="No demands yet"
                description="Post your first demand to get farmer offers."
                action={<Link to="/buyer/demands/new" className="btn-md btn-accent"><PlusCircle size={15} /> Post demand</Link>} />
            ) : (
              <div className="divide-y divide-gray-100">
                {demands.slice(0, 6).map(d => <DemandRow key={d.id} d={d} compact />)}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'demands' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <p className="card-title">All demands <span className="font-normal text-gray-400">({demands.length})</span></p>
            <Link to="/buyer/demands/new" className="btn-sm btn-accent">
              <PlusCircle size={13} /> New
            </Link>
          </div>
          {demands.length === 0 ? (
            <EmptyState bare icon={PlusCircle} title="No demands yet" description="Post your first demand to get farmer offers." />
          ) : (
            <div className="divide-y divide-gray-100">
              {demands.map(d => <DemandRow key={d.id} d={d} />)}
            </div>
          )}
        </div>
      )}

      {tab === 'offers' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <p className="card-title">Farmer offers <span className="font-normal text-gray-400">({commitments.length})</span></p>
              <p className="card-sub">{pending} pending · {accepted} accepted</p>
            </div>
          </div>
          {commitments.length === 0 ? (
            <EmptyState bare icon={MapPin} title="No farmer offers yet" description="When farmers commit to your demands, they'll appear here." />
          ) : (
            <div className="divide-y divide-gray-100">
              {commitments.map((c: any) => <OfferRow key={c.id} c={c} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
