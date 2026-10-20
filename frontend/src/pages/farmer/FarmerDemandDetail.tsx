import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CheckCircle, Leaf, AlertCircle, BookOpen, Inbox, Lock, Loader2 } from 'lucide-react';
import { Demand, Guidance } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import CropThumb from '../../components/CropThumb';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import api from '../../lib/api';

export default function FarmerDemandDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [guidance, setGuidance] = useState<Guidance[]>([]);
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [qty, setQty] = useState('');
  const [commitType, setCommitType] = useState<'partial' | 'full'>('partial');

  useEffect(() => {
    api.get(`/demands/${id}`)
      .then(r => {
        setDemand(r.data);
        if (r.data.crop?.guidance) setGuidance(r.data.crop.guidance);
      })
      .catch(() => toast.error('Demand not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCommit = async () => {
    const quantity = parseFloat(qty);
    if (!quantity || quantity <= 0) { toast.error('Enter a valid quantity'); return; }
    if (demand && quantity > demand.quantity) {
      toast.error(`Cannot exceed required quantity of ${demand.quantity} kg`); return;
    }
    setCommitting(true);
    try {
      const res = await api.post('/commitments', {
        demandId: parseInt(id!), committedQuantity: quantity, commitmentType: commitType,
      });
      toast.success('Commitment submitted! The buyer will review your offer shortly.');
      if (res.data.guidance?.length) setGuidance(res.data.guidance);
      navigate('/farmer/commitments');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit commitment');
    } finally { setCommitting(false); }
  };

  if (loading) return <Spinner />;
  if (!demand) return <EmptyState icon={Inbox} title="Demand not found" description="It may have been closed or removed." />;

  const totalCommitted = demand.commitments?.filter(c => c.status !== 'cancelled' && c.status !== 'rejected')
    .reduce((s, c) => s + c.committedQuantity, 0) || 0;
  const remaining = demand.quantity - totalCommitted;
  const pct = Math.min(100, Math.round((totalCommitted / demand.quantity) * 100));
  const estimatedEarnings = qty ? parseFloat(qty) * demand.pricePerUnit : 0;
  const buyer = demand.buyer as any;

  return (
    <div>
      <PageHeader back
        title={
          <span className="flex items-center gap-4">
            <CropThumb name={demand.crop.cropName} size={52} rounded="2xl" />
            <span>{demand.crop.cropName}</span>
          </span>
        }
        subtitle={`${demand.crop.category} · ${demand.qualityStandard} quality`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Demand overview */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 pt-5">
              <div className="flex items-center gap-2.5">
                <Avatar name={buyer?.user?.name} size={34} />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-gray-900">{buyer?.user?.name}</p>
                  {buyer?.businessName && <p className="text-xs text-gray-500">{buyer.businessName}</p>}
                </div>
              </div>
              <StatusBadge status={demand.status} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-px border-y border-gray-100 bg-gray-100 sm:grid-cols-3">
              {[
                { label: 'Total required', value: `${demand.quantity.toLocaleString()} kg` },
                { label: 'Remaining',      value: `${remaining.toLocaleString()} kg` },
                { label: 'Price / kg',     value: `₦${demand.pricePerUnit}` },
                { label: 'Total value',    value: `₦${(demand.quantity * demand.pricePerUnit).toLocaleString()}` },
                { label: 'Deliver from',   value: format(new Date(demand.deliveryStart), 'MMM d, yyyy') },
                { label: 'Deliver by',     value: format(new Date(demand.deliveryEnd), 'MMM d, yyyy') },
              ].map(s => (
                <div key={s.label} className="bg-white px-6 py-4">
                  <p className="stat-label mb-1">{s.label}</p>
                  <p className="tabular text-[15px] font-semibold text-gray-900">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-5">
              <div className="mb-2.5 flex justify-between text-xs">
                <span className="font-medium text-gray-500">{demand.commitments?.length || 0} farmers committed</span>
                <span className="font-semibold text-gray-900">{pct}% of demand filled</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-forest-600 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            {demand.notes && (
              <div className="mx-6 mb-6 rounded-2xl bg-gray-50 p-4">
                <p className="stat-label mb-1">Buyer notes</p>
                <p className="text-sm leading-relaxed text-gray-700">{demand.notes}</p>
              </div>
            )}
          </div>

          {/* Commit CTA */}
          {demand.status === 'open' && !showForm && (
            <button onClick={() => setShowForm(true)}
              className="card flex w-full flex-col items-start justify-between gap-4 p-5 text-left transition-colors hover:border-gray-300 sm:flex-row sm:items-center">
              <div>
                <p className="text-[15px] font-semibold text-gray-900">Commit to supply this demand</p>
                <p className="mt-0.5 text-sm text-gray-500">Up to {remaining.toLocaleString()} kg at ₦{demand.pricePerUnit}/kg</p>
              </div>
              <span className="btn-lg btn-primary shrink-0">
                <CheckCircle size={16} /> Commit
              </span>
            </button>
          )}

          {/* Commit form */}
          {showForm && (
            <div className="card animate-slide-up overflow-hidden">
              <div className="card-header">
                <p className="card-title">Submit your commitment</p>
              </div>
              <div className="space-y-6 p-4 sm:p-6">
                <div className="form-group">
                  <label className="label">How many kg can you supply?</label>
                  <div className="relative">
                    <input type="number" step="1" min="1" max={remaining}
                      value={qty} onChange={e => setQty(e.target.value)}
                      className="input h-12 pr-12 text-lg font-medium"
                      placeholder={`Up to ${remaining.toLocaleString()}`} autoFocus />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">kg</span>
                  </div>
                  <p className="hint">Maximum {remaining.toLocaleString()} kg remaining</p>
                </div>

                <div className="form-group">
                  <label className="label">Commitment type</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {([
                      { value: 'partial', label: 'Partial supply', desc: 'I can supply some of the quantity' },
                      { value: 'full',    label: 'Full supply',    desc: 'I can supply the entire quantity' },
                    ] as const).map(t => (
                      <button key={t.value} type="button" onClick={() => setCommitType(t.value)}
                        className={`option-card ${commitType === t.value ? 'option-card-active' : ''}`}>
                        <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {estimatedEarnings > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                    <p className="text-sm font-medium">Estimated earnings</p>
                    <p className="tabular text-xl font-semibold text-gray-900">₦{estimatedEarnings.toLocaleString()}</p>
                  </div>
                )}

                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <AlertCircle size={14} className="mt-px shrink-0" />
                  <span>The buyer will review your offer and accept or reject it.</span>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button onClick={() => setShowForm(false)} className="btn-lg btn-secondary flex-1">Cancel</button>
                  <button onClick={handleCommit} disabled={committing || !qty} className="btn-lg btn-accent flex-1">
                    {committing ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : <><CheckCircle size={15} /> Confirm commitment</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {demand.status === 'closed' && (
            <div className="card flex items-center gap-3 p-5 text-sm text-gray-600">
              <Lock size={16} className="text-gray-400" />
              This demand is closed and no longer accepting commitments.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="relative h-28 overflow-hidden">
              <CropThumb name={demand.crop.cropName} size={400} rounded="lg" className="!h-full !w-full !rounded-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-3 left-5 flex items-center gap-2 font-display text-[15px] font-semibold text-white">
                <Leaf size={14} /> About {demand.crop.cropName}
              </p>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Category</span>
                <span className="font-medium text-gray-900">{demand.crop.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Season</span>
                <span className="font-medium text-gray-900">{demand.crop.seasonality}</span>
              </div>
              {demand.crop.storageRequirements && (
                <p className="border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">
                  {demand.crop.storageRequirements}
                </p>
              )}
            </div>
          </div>

          {guidance.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <p className="card-title flex items-center gap-2"><BookOpen size={15} className="text-forest-600" /> Farming guidance</p>
              </div>
              <div className="space-y-4 p-5">
                {guidance.map(g => (
                  <div key={g.id} className="border-l-2 border-gray-200 pl-3">
                    <p className="mb-1 text-xs font-semibold capitalize text-gray-800">
                      {g.guidanceType.replace('_', ' ')}
                      <span className="ml-1 font-normal text-gray-400">· {g.growthStage}</span>
                    </p>
                    <p className="text-xs leading-relaxed text-gray-500">{g.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
