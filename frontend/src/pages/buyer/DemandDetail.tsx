import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Lock, Leaf, Inbox, MapPin, Clock, BookOpen, RefreshCw } from 'lucide-react';
import { Demand } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
import CropThumb from '../../components/CropThumb';
import EmptyState from '../../components/EmptyState';
import api from '../../lib/api';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export default function DemandDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh: refreshNotifs } = useNotifications();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = () => api.get(`/demands/${id}`).then(r => setDemand(r.data));

  useEffect(() => {
    load().catch(() => toast.error('Demand not found')).finally(() => setLoading(false));
  }, [id]);

  const updateCommitment = async (commitmentId: number, status: 'accepted' | 'rejected') => {
    setUpdating(commitmentId);
    try {
      await api.patch(`/commitments/${commitmentId}/status`, { status });
      toast.success(status === 'accepted' ? 'Offer accepted!' : 'Offer rejected');
      await load();
      refreshNotifs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally { setUpdating(null); }
  };

  const closeDemand = async () => {
    if (!confirm('Close this demand? Farmers will no longer be able to submit offers.')) return;
    try {
      await api.patch(`/demands/${id}`, { status: 'closed' });
      toast.success('Demand closed');
      navigate('/buyer/demands');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <Spinner />;
  if (!demand) return (
    <EmptyState icon={Inbox} title="Demand not found" description="It may have been removed or closed."
      action={<Link to="/buyer/demands" className="btn-md btn-secondary">Back to demands</Link>} />
  );

  const isMine = demand.buyerId === user?.buyer?.id;
  const totalCommitted = demand.commitments?.filter(c => c.status !== 'cancelled' && c.status !== 'rejected')
    .reduce((s, c) => s + c.committedQuantity, 0) || 0;
  const pct = Math.min(100, Math.round((totalCommitted / demand.quantity) * 100));
  const pendingCommitments = demand.commitments?.filter(c => c.status === 'pending') || [];
  const acceptedCommitments = demand.commitments?.filter(c => c.status === 'accepted') || [];
  const otherCommitments = demand.commitments?.filter(c => !['pending', 'accepted'].includes(c.status)) || [];

  return (
    <div>
      <PageHeader back
        title={
          <span className="flex items-center gap-4">
            <CropThumb name={demand.crop.cropName} size={52} rounded="2xl" />
            <span>{demand.crop.cropName}</span>
          </span>
        }
        subtitle={`${demand.crop.category} · Posted ${format(new Date(demand.createdAt), 'MMM d, yyyy')} · #${demand.id}`}
        action={
          demand.status !== 'closed' && isMine ? (
            <button onClick={closeDemand} className="btn-md btn-secondary">
              <Lock size={14} /> Close demand
            </button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 pt-5">
              <StatusBadge status={demand.status} />
              {(demand as any).isRecurring && (
                <span className="badge-gray"><RefreshCw size={11} /> {(demand as any).recurrenceNote || 'Recurring'}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-3 mt-5 border-y border-gray-100">
              {[
                { label: 'Quantity',    value: `${demand.quantity.toLocaleString()} kg` },
                { label: 'Price / kg',  value: `₦${demand.pricePerUnit}` },
                { label: 'Total value', value: `₦${(demand.quantity * demand.pricePerUnit).toLocaleString()}` },
                { label: 'Quality',     value: demand.qualityStandard },
                { label: 'From',        value: format(new Date(demand.deliveryStart), 'MMM d, yyyy') },
                { label: 'Due',         value: format(new Date(demand.deliveryEnd), 'MMM d, yyyy') },
              ].map(s => (
                <div key={s.label} className="bg-white px-6 py-4">
                  <p className="stat-label mb-1">{s.label}</p>
                  <p className="tabular text-[15px] font-semibold text-gray-900">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-5">
              <div className="mb-2.5 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-500">Fulfilment</span>
                <span className="tabular font-semibold text-gray-900">{totalCommitted.toLocaleString()} / {demand.quantity.toLocaleString()} kg · {pct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-forest-600 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            {demand.notes && (
              <div className="mx-6 mb-6 rounded-2xl bg-gray-50 p-4">
                <p className="stat-label mb-1">Notes</p>
                <p className="text-sm leading-relaxed text-gray-700">{demand.notes}</p>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="card-header">
              <div>
                <p className="card-title">
                  Farmer offers{demand.commitments?.length ? <span className="font-normal text-gray-400"> ({demand.commitments.length})</span> : ''}
                </p>
                {pendingCommitments.length > 0 && (
                  <p className="card-sub">{pendingCommitments.length} awaiting review</p>
                )}
              </div>
            </div>

            {!demand.commitments?.length ? (
              <EmptyState bare icon={Inbox} title="No offers yet" description="Farmers will see your demand and respond." />
            ) : (
              <div className="divide-y divide-gray-100">
                {[...pendingCommitments, ...acceptedCommitments, ...otherCommitments].map((c: any) => (
                  <div key={c.id} className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3.5">
                      <Avatar name={c.farmer?.user?.name} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{c.farmer?.user?.name}</p>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="tabular text-sm text-gray-700">
                          {c.committedQuantity} kg · <span className="font-semibold">₦{(c.committedQuantity * demand.pricePerUnit).toLocaleString()}</span>
                        </p>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-500">
                          {c.farmer?.farmLocation && <span className="inline-flex items-center gap-1"><MapPin size={11} />{c.farmer.farmLocation}</span>}
                          <span className="inline-flex items-center gap-1"><Clock size={11} />{format(new Date(c.committedAt), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    {c.status === 'pending' && isMine && (
                      <div className="flex shrink-0 items-center gap-2 pl-[58px] sm:pl-0">
                        <button onClick={() => updateCommitment(c.id, 'accepted')} disabled={updating === c.id}
                          className="btn-sm btn-primary">
                          <CheckCircle size={13} /> Accept
                        </button>
                        <button onClick={() => updateCommitment(c.id, 'rejected')} disabled={updating === c.id}
                          className="btn-sm btn-secondary">
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="relative h-28 overflow-hidden">
              <CropThumb name={demand.crop.cropName} size={400} rounded="lg" className="!h-full !w-full !rounded-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-3 left-5 flex items-center gap-2 font-display text-[15px] font-semibold text-white">
                <Leaf size={14} /> Crop info
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
                <p className="border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500">{demand.crop.storageRequirements}</p>
              )}
            </div>
          </div>

          {demand.crop.guidance && demand.crop.guidance.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <p className="card-title flex items-center gap-2"><BookOpen size={15} className="text-forest-600" /> Crop guidance</p>
              </div>
              <div className="space-y-4 p-5">
                {demand.crop.guidance.map(g => (
                  <div key={g.id}>
                    <p className="mb-1 text-xs font-semibold capitalize text-gray-800">
                      {g.guidanceType.replace('_', ' ')}
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
