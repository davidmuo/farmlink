import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CheckCircle, Leaf, AlertCircle, BookOpen } from 'lucide-react';
import { Demand, Guidance } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
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
  if (!demand) return <div className="border border-gray-100 rounded-2xl text-center py-16 text-gray-400">Demand not found</div>;

  const totalCommitted = demand.commitments?.filter(c => c.status !== 'cancelled' && c.status !== 'rejected')
    .reduce((s, c) => s + c.committedQuantity, 0) || 0;
  const remaining = demand.quantity - totalCommitted;
  const pct = Math.min(100, Math.round((totalCommitted / demand.quantity) * 100));
  const estimatedEarnings = qty ? parseFloat(qty) * demand.pricePerUnit : 0;

  return (
    <div>
      <PageHeader back title={demand.crop.cropName}
        subtitle={`${demand.crop.category} · ${demand.qualityStandard} quality`} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Demand overview */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <StatusBadge status={demand.status} />
              <p className="text-xs text-gray-400">by {(demand.buyer as any)?.user?.name}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-gray-50">
              {[
                { label: 'Total required', value: `${demand.quantity.toLocaleString()} kg` },
                { label: 'Remaining',      value: `${remaining.toLocaleString()} kg` },
                { label: 'Price / kg',     value: `₦${demand.pricePerUnit}` },
                { label: 'Total value',    value: `₦${(demand.quantity * demand.pricePerUnit).toLocaleString()}` },
                { label: 'Deliver from',   value: format(new Date(demand.deliveryStart), 'MMM d, yyyy') },
                { label: 'Deliver by',     value: format(new Date(demand.deliveryEnd), 'MMM d, yyyy') },
              ].map(s => (
                <div key={s.label} className="px-5 py-3.5">
                  <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
                  <p className="font-semibold text-gray-900 text-sm">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-50">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{demand.commitments?.length || 0} farmers committed</span>
                <span>{pct}% of demand filled</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#6DFF8A' }} />
              </div>
            </div>
            {demand.notes && (
              <div className="px-5 pb-4">
                <p className="text-xs text-gray-400 mb-1">Buyer notes</p>
                <p className="text-sm text-gray-600">{demand.notes}</p>
              </div>
            )}
          </div>

          {/* Commit CTA */}
          {demand.status === 'open' && !showForm && (
            <button onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-2xl text-gray-900 transition-opacity hover:opacity-90"
              style={{ background: '#6DFF8A' }}>
              <CheckCircle size={17} /> Commit to Supply This Demand
            </button>
          )}

          {/* Commit form */}
          {showForm && (
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="font-bold text-gray-900">Submit Your Commitment</p>
              </div>
              <div className="p-5 space-y-5">
                <div className="form-group">
                  <label className="label">How many kg can you supply?</label>
                  <input type="number" step="1" min="1" max={remaining}
                    value={qty} onChange={e => setQty(e.target.value)}
                    className="input text-lg font-semibold"
                    placeholder={`Up to ${remaining.toLocaleString()} kg`} autoFocus />
                  <p className="hint">Maximum {remaining.toLocaleString()} kg remaining</p>
                </div>

                <div className="form-group">
                  <label className="label">Commitment type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'partial', label: 'Partial supply', desc: 'I can supply some of the quantity' },
                      { value: 'full',    label: 'Full supply',    desc: 'I can supply the entire quantity' },
                    ] as const).map(t => (
                      <button key={t.value} type="button" onClick={() => setCommitType(t.value)}
                        className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                          commitType === t.value
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <p className={`font-semibold text-sm ${commitType === t.value ? 'text-gray-900' : 'text-gray-600'}`}>
                          {t.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {estimatedEarnings > 0 && (
                  <div className="border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
                    <p className="text-xs text-gray-400">Estimated earnings</p>
                    <p className="font-bold text-gray-900 text-lg">₦{estimatedEarnings.toLocaleString()}</p>
                  </div>
                )}

                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  <span>The buyer will review your offer and accept or reject it.</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowForm(false)} className="flex-1 flex items-center justify-center font-bold text-sm py-3 rounded-xl text-gray-600 border border-gray-200 bg-white">Cancel</button>
                  <button onClick={handleCommit} disabled={committing || !qty} className="flex-1 flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl text-gray-900 disabled:opacity-50" style={{ background: '#6DFF8A' }}>
                    <CheckCircle size={15} />
                    {committing ? 'Submitting…' : 'Confirm Commitment'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {demand.status === 'closed' && (
            <div className="border border-gray-100 rounded-2xl text-center py-8">
              <p className="text-gray-400 text-sm">This demand is closed and no longer accepting commitments.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Leaf size={14} className="text-gray-400" />
              <p className="font-semibold text-gray-900 text-sm">About {demand.crop.cropName}</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Category</span>
                <span className="font-medium text-gray-900">{demand.crop.category}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Season</span>
                <span className="font-medium text-gray-900">{demand.crop.seasonality}</span>
              </div>
              {demand.crop.storageRequirements && (
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-50 leading-relaxed">
                  {demand.crop.storageRequirements}
                </p>
              )}
            </div>
          </div>

          {guidance.length > 0 && (
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="font-semibold text-gray-900 text-sm">Farming Guidance</p>
              </div>
              <div className="p-5 space-y-4">
                {guidance.map(g => (
                  <div key={g.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen size={11} className="text-gray-400 shrink-0" />
                      <p className="text-xs font-semibold text-gray-600 capitalize">
                        {g.guidanceType.replace('_', ' ')}
                        <span className="text-gray-400 font-normal ml-1">· {g.growthStage}</span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed pl-4">{g.content}</p>
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
