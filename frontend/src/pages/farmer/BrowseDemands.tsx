import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, SlidersHorizontal, X, ChevronRight } from 'lucide-react';
import { Demand, Crop } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import api from '../../lib/api';

const fmt = (n: number) =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `₦${(n / 1_000).toFixed(0)}k`
  : `₦${n.toLocaleString()}`;

interface MarketPrice {
  id: number;
  priceMin: number;
  priceMax: number;
  unit: string;
  crop: { cropName: string };
}

export default function BrowseDemands() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ crop: '', minPrice: '', maxPrice: '', search: '', deliveryFrom: '', deliveryTo: '' });
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);

  const fetchDemands = (f = filters) => {
    setLoading(true);
    const params: Record<string, string> = { status: 'open' };
    if (f.crop) params.crop = f.crop;
    if (f.minPrice) params.minPrice = f.minPrice;
    if (f.maxPrice) params.maxPrice = f.maxPrice;
    if (f.deliveryFrom) params.deliveryFrom = f.deliveryFrom;
    if (f.deliveryTo) params.deliveryTo = f.deliveryTo;
    api.get('/demands', { params }).then(r => setDemands(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/crops').then(r => setCrops(r.data));
    api.get('/market-prices').then(r => setMarketPrices(r.data)).catch(() => {});
    fetchDemands();
  }, []);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters(p => ({ ...p, [f]: e.target.value }));

  const clearFilters = () => {
    const reset = { crop: '', minPrice: '', maxPrice: '', search: '', deliveryFrom: '', deliveryTo: '' };
    setFilters(reset);
    fetchDemands(reset);
  };

  const hasFilters = filters.crop || filters.minPrice || filters.maxPrice || filters.deliveryFrom || filters.deliveryTo;

  const displayed = filters.search
    ? demands.filter(d => d.crop?.cropName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (d.buyer as any)?.user?.name?.toLowerCase().includes(filters.search.toLowerCase()))
    : demands;

  return (
    <div>
      <PageHeader title="Browse Demands" subtitle="Find buyers looking for produce you grow" />

      {marketPrices.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Market Prices
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            {marketPrices.map(mp => (
              <div key={mp.id}
                className="border border-gray-100 bg-white rounded-xl px-3 py-1.5 text-xs shrink-0 flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-semibold text-gray-800">{mp.crop?.cropName}</span>
                <span className="text-gray-400">₦{mp.priceMin}–₦{mp.priceMax}/{mp.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={filters.search} onChange={set('search')} className="input pl-9"
            placeholder="Search by crop or buyer..." />
        </div>
        <button onClick={() => setShowFilters(s => !s)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
            hasFilters
              ? ''
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
          style={hasFilters ? { background: '#6DFF8A', color: '#111827', borderColor: '#6DFF8A' } : {}}>
          <SlidersHorizontal size={14} /> Filters
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-gray-900" />}
        </button>
        {hasFilters && (
          <button onClick={clearFilters}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {showFilters && (
        <div className="border border-gray-100 rounded-2xl p-5 mb-5">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label">Crop type</label>
              <select value={filters.crop} onChange={set('crop')} className="input">
                <option value="">All crops</option>
                {crops.map(c => <option key={c.id} value={c.cropName}>{c.cropName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Min price (₦/kg)</label>
              <input type="number" value={filters.minPrice} onChange={set('minPrice')} className="input" placeholder="0" />
            </div>
            <div className="form-group">
              <label className="label">Max price (₦/kg)</label>
              <input type="number" value={filters.maxPrice} onChange={set('maxPrice')} className="input" placeholder="Any" />
            </div>
            <div className="form-group">
              <label className="label">Delivery from</label>
              <input type="date" value={filters.deliveryFrom} onChange={set('deliveryFrom')} className="input" />
            </div>
            <div className="form-group">
              <label className="label">Delivery by</label>
              <input type="date" value={filters.deliveryTo} onChange={set('deliveryTo')} className="input" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => fetchDemands()} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-gray-900" style={{ background: '#6DFF8A' }}>Apply</button>
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-gray-600 border border-gray-200 bg-white">Clear</button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : displayed.length === 0 ? (
        <EmptyState icon={Search} title="No open demands found"
          description="Try adjusting your filters, or check back later for new buyer demands." />
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-4">{displayed.length} demand{displayed.length !== 1 ? 's' : ''} found</p>
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="divide-y divide-gray-50">
              {displayed.map(demand => {
                const totalCommitted = demand.commitments?.filter(c => c.status !== 'cancelled' && c.status !== 'rejected')
                  .reduce((s, c) => s + c.committedQuantity, 0) || 0;
                const pct = Math.min(100, Math.round((totalCommitted / demand.quantity) * 100));
                const remaining = demand.quantity - totalCommitted;

                return (
                  <Link key={demand.id} to={`/farmer/demands/${demand.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm">{demand.crop.cropName}</p>
                        <StatusBadge status={demand.status} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {(demand.buyer as any)?.user?.name} · {remaining.toLocaleString()} kg remaining · Due {format(new Date(demand.deliveryEnd), 'MMM d')}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-28 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#6DFF8A' }} />
                        </div>
                        <span className="text-xs text-gray-400">{pct}% committed</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">₦{demand.pricePerUnit}/kg</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmt(demand.quantity * demand.pricePerUnit)} total</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
