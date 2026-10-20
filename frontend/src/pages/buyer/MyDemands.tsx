import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ShoppingBag, PlusCircle, Search, ChevronRight, CalendarDays } from 'lucide-react';
import { Demand } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import CropThumb from '../../components/CropThumb';
import api from '../../lib/api';

export default function MyDemands() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    api.get('/demands', { params: { mine: true } })
      .then(r => setDemands(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = demands.filter(d => {
    const matchSearch = d.crop?.cropName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <Spinner />;

  const postBtn = <Link to="/buyer/demands/new" className="btn-lg btn-accent"><PlusCircle size={16} /> Post demand</Link>;

  return (
    <div>
      <PageHeader
        title="My Demands"
        subtitle={`${demands.length} demand${demands.length !== 1 ? 's' : ''} posted`}
        action={postBtn}
      />

      {demands.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input h-10 pl-10" placeholder="Search by crop…" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {['all', 'open', 'partially_filled', 'closed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`chip shrink-0 ${statusFilter === s ? 'chip-active' : ''}`}>
                {s === 'all' ? 'All' : s === 'partially_filled' ? 'Partial' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={demands.length === 0 ? 'No demands yet' : 'No results'}
          description={demands.length === 0 ? 'Post your first demand and farmers will respond.' : 'Try different filters.'}
          action={demands.length === 0 ? postBtn : undefined}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filtered.map(d => {
              const totalCommitted = d.commitments?.filter(c => c.status !== 'cancelled' && c.status !== 'rejected')
                .reduce((s, c) => s + c.committedQuantity, 0) || 0;
              const pct = Math.min(100, Math.round((totalCommitted / d.quantity) * 100));

              return (
                <Link key={d.id} to={`/buyer/demands/${d.id}`}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/80 sm:px-6">
                  <CropThumb name={d.crop?.cropName} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="text-[15px] font-semibold text-gray-900">{d.crop?.cropName}</p>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500">
                      <span>{d.quantity.toLocaleString()} kg</span>·<span>₦{d.pricePerUnit}/kg</span>·
                      <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> Due {format(new Date(d.deliveryEnd), 'MMM d, yyyy')}</span>
                    </p>
                  </div>
                  <div className="hidden w-36 shrink-0 md:block">
                    <div className="mb-1.5 flex justify-between text-[11px] text-gray-500">
                      <span>Filled</span><span className="font-semibold text-gray-700">{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-forest-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {d.commitments?.length || 0} offer{d.commitments?.length !== 1 ? 's' : ''}
                    </p>
                    <p className="tabular text-xs text-gray-500">₦{(d.quantity * d.pricePerUnit).toLocaleString()}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
