import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ShoppingBag, PlusCircle, Search, ChevronRight } from 'lucide-react';
import { Demand } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
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

  return (
    <div>
      <PageHeader
        title="My Demands"
        subtitle={`${demands.length} demand${demands.length !== 1 ? 's' : ''} posted`}
        action={<Link to="/buyer/demands/new" className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-gray-900" style={{ background: '#6DFF8A' }}><PlusCircle size={15} /> Post demand</Link>}
      />

      {demands.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-9 text-sm" placeholder="Search by crop..." />
          </div>
          <div className="flex gap-1.5">
            {['all', 'open', 'partially_filled', 'closed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  statusFilter === s
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}>
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
          action={demands.length === 0 ? <Link to="/buyer/demands/new" className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-gray-900" style={{ background: '#6DFF8A' }}><PlusCircle size={15} /> Post demand</Link> : undefined}
        />
      ) : (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map(d => {
              const totalCommitted = d.commitments?.filter(c => c.status !== 'cancelled' && c.status !== 'rejected')
                .reduce((s, c) => s + c.committedQuantity, 0) || 0;
              const pct = Math.min(100, Math.round((totalCommitted / d.quantity) * 100));

              return (
                <Link key={d.id} to={`/buyer/demands/${d.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{d.crop?.cropName}</p>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {d.quantity.toLocaleString()} kg · ₦{d.pricePerUnit}/kg · Due {format(new Date(d.deliveryEnd), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#6DFF8A' }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{pct}%</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {d.commitments?.length || 0} offer{d.commitments?.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-400">₦{(d.quantity * d.pricePerUnit).toLocaleString()}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
