import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Lock, Leaf, AlertTriangle } from 'lucide-react';
import { Demand } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
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
    <div className="border border-gray-100 rounded-2xl text-center py-16">
      <p className="text-gray-400">Demand not found</p>
      <Link to="/buyer/demands" className="btn-md btn-secondary mt-4 inline-flex">Back to demands</Link>
    </div>
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
      <PageHeader back title={demand.crop.cropName}
        subtitle={`${demand.crop.category} · Posted ${format(new Date(demand.createdAt), 'MMM d, yyyy')}`}
        action={
          demand.status !== 'closed' && isMine ? (
            <button onClick={closeDemand}
              className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-2 rounded-xl transition-colors">
              <Lock size={13} /> Close demand
            </button>
          ) : undefined
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Overview */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <StatusBadge status={demand.status} />
              <span className="text-xs text-gray-400">#{demand.id}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-gray-50">
              {[
                { label: 'Quantity',    value: `${demand.quantity.toLocaleString()} kg` },
                { label: 'Price / kg', value: `₦${demand.pricePerUnit}` },
                { label: 'Total value',value: `₦${(demand.quantity * demand.pricePerUnit).toLocaleString()}` },
                { label: 'Quality',    value: demand.qualityStandard },
                { label: 'From',       value: format(new Date(demand.deliveryStart), 'MMM d, yyyy') },
                { label: 'Due',        value: format(new Date(demand.deliveryEnd), 'MMM d, yyyy') },
              ].map(s => (
                <div key={s.label} className="px-5 py-3.5">
                  <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
                  <p className="font-semibold text-gray-900 text-sm">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Fulfillment</span>
                <span className="font-semibold text-gray-700">{totalCommitted.toLocaleString()} / {demand.quantity.toLocaleString()} kg · {pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#6DFF8A' }} />
              </div>
            </div>
            {demand.notes && (
              <div className="px-5 pb-4">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-600">{demand.notes}</p>
              </div>
            )}
          </div>

          {/* Offers */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <p className="font-bold text-gray-900">
                Farmer Offers{demand.commitments?.length ? ` (${demand.commitments.length})` : ''}
              </p>
              {pendingCommitments.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{pendingCommitments.length} awaiting review</p>
              )}
            </div>

            {!demand.commitments?.length ? (
              <div className="px-5 py-12 text-center">
                <AlertTriangle size={24} className="text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No offers yet. Farmers will see your demand and respond.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {[...pendingCommitments, ...acceptedCommitments, ...otherCommitments].map((c: any) => (
                  <div key={c.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 text-sm shrink-0">
                      {c.farmer?.user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 text-sm">{c.farmer?.user?.name}</p>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-gray-500">
                        {c.committedQuantity} kg · ₦{(c.committedQuantity * demand.pricePerUnit).toLocaleString()}
                      </p>
                      <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                        {c.farmer?.farmLocation && <span>{c.farmer.farmLocation}</span>}
                        <span>{format(new Date(c.committedAt), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    {c.status === 'pending' && isMine && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => updateCommitment(c.id, 'accepted')} disabled={updating === c.id}
                          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                          <CheckCircle size={12} /> Accept
                        </button>
                        <button onClick={() => updateCommitment(c.id, 'rejected')} disabled={updating === c.id}
                          className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 transition-colors">
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Leaf size={14} className="text-gray-400" />
              <p className="font-semibold text-gray-900 text-sm">Crop Info</p>
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
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-50">{demand.crop.storageRequirements}</p>
              )}
            </div>
          </div>

          {demand.crop.guidance && demand.crop.guidance.length > 0 && (
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="font-semibold text-gray-900 text-sm">Crop Guidance</p>
              </div>
              <div className="p-5 space-y-4">
                {demand.crop.guidance.map(g => (
                  <div key={g.id}>
                    <p className="text-xs font-semibold text-gray-600 capitalize mb-1">
                      {g.guidanceType.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">{g.content}</p>
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
