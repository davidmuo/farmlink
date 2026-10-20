import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, SlidersHorizontal, X, ChevronRight, CalendarDays, TrendingUp } from 'lucide-react';
import { Demand, Crop } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import CropThumb from '../../components/CropThumb';
import Avatar from '../../components/Avatar';
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
      <PageHeader title="Browse Demands" subtitle="Find buyers looking for produce you grow." />

      {marketPrices.length > 0 && (
        <div className="mb-6">
          <p className="stat-label mb-2.5 flex items-center gap-1.5"><TrendingUp size={12} /> Market prices</p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            {marketPrices.map(mp => (
              <div key={mp.id}
                className="flex shrink-0 items-center gap-2.5 rounded-lg border border-gray-200 bg-white py-1 pl-1 pr-3">
                <CropThumb name={mp.crop?.cropName} size={30} rounded="lg" />
                <div className="whitespace-nowrap leading-tight">
                  <p className="text-xs font-semibold text-gray-900">{mp.crop?.cropName}</p>
                  <p className="tabular text-[11px] text-gray-500">₦{mp.priceMin}-₦{mp.priceMax}/{mp.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-5 flex gap-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={filters.search} onChange={set('search')} className="input h-10 pl-10"
            placeholder="Search by crop or buyer…" />
        </div>
        <button onClick={() => setShowFilters(s => !s)}
          className={`btn h-10 border px-3.5 text-sm ${hasFilters || showFilters ? 'border-forest-800 bg-forest-800 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`}>
          <SlidersHorizontal size={15} /> <span className="hidden sm:inline">Filters</span>
          {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} aria-label="Clear filters"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-800">
            <X size={15} />
          </button>
        )}
      </div>

      {showFilters && (
        <div className="card mb-5 animate-slide-down p-5">
          <div className="grid gap-4 sm:grid-cols-3">
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
          <div className="mt-5 flex gap-2">
            <button onClick={() => fetchDemands()} className="btn-md btn-accent">Apply filters</button>
            <button onClick={clearFilters} className="btn-md btn-secondary">Clear</button>
          </div>
        </div>
      )}

      {loading ? <Spinner variant="inline" /> : displayed.length === 0 ? (
        <EmptyState icon={Search} title="No open demands found"
          description="Try adjusting your filters, or check back later for new buyer demands." />
      ) : (
        <>
          <p className="mb-3 text-xs font-medium text-gray-500">{displayed.length} demand{displayed.length !== 1 ? 's' : ''} found</p>
          <div className="grid gap-3 md:grid-cols-2">
            {displayed.map(demand => {
              const totalCommitted = demand.commitments?.filter(c => c.status !== 'cancelled' && c.status !== 'rejected')
                .reduce((s, c) => s + c.committedQuantity, 0) || 0;
              const pct = Math.min(100, Math.round((totalCommitted / demand.quantity) * 100));
              const remaining = demand.quantity - totalCommitted;
              const buyerName = (demand.buyer as any)?.user?.name;

              return (
                <Link key={demand.id} to={`/farmer/demands/${demand.id}`}
                  className="card-hover group flex min-w-0 flex-col p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <CropThumb name={demand.crop.cropName} size={48} rounded="xl" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-base font-semibold text-gray-900">{demand.crop.cropName}</p>
                        <StatusBadge status={demand.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Avatar name={buyerName} size={18} />
                        <span className="truncate">{buyerName}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular text-base font-semibold text-gray-900">₦{demand.pricePerUnit}<span className="text-xs font-normal text-gray-500">/kg</span></p>
                      <p className="tabular text-xs text-gray-500">{fmt(demand.quantity * demand.pricePerUnit)} total</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-800">{remaining.toLocaleString()} kg remaining</span>
                      <span className="text-gray-500">{pct}% committed</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-forest-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                      <CalendarDays size={13} /> Due {format(new Date(demand.deliveryEnd), 'MMM d')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 transition-transform group-hover:translate-x-0.5">
                      View &amp; commit <ChevronRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
