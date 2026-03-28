import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, CheckSquare, Truck, BadgeCheck } from 'lucide-react';
import { Commitment } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import api from '../../lib/api';
import { useNotifications } from '../../context/NotificationContext';

const GREEN = '#6DFF8A';

type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'completed';

function DeliveryBadge({ status }: { status: DeliveryStatus }) {
  const cfg: Record<DeliveryStatus, { label: string; cls: string }> = {
    pending:    { label: 'Pending Delivery', cls: 'bg-gray-100 text-gray-500' },
    in_transit: { label: 'In Transit',       cls: 'bg-gray-200 text-gray-700' },
    delivered:  { label: 'Delivered',        cls: 'bg-green-100 text-green-700' },
    completed:  { label: 'Completed',        cls: 'bg-gray-800 text-white' },
  };
  const { label, cls } = cfg[status] || cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {status === 'in_transit' && <Truck size={9} />}
      {label}
    </span>
  );
}

export default function BuyerCommitments() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [updating, setUpdating] = useState<number | null>(null);
  const [updatingDelivery, setUpdatingDelivery] = useState<number | null>(null);
  const { refresh: refreshNotifs } = useNotifications();

  const load = () => api.get('/commitments').then(r => setCommitments(r.data));
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const updateStatus = async (id: number, status: 'accepted' | 'rejected') => {
    setUpdating(id);
    try {
      await api.patch(`/commitments/${id}/status`, { status });
      toast.success(status === 'accepted' ? 'Offer accepted!' : 'Offer rejected');
      await load();
      refreshNotifs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally { setUpdating(null); }
  };

  const confirmReceipt = async (id: number) => {
    setUpdatingDelivery(id);
    try {
      await api.patch(`/commitments/${id}/delivery`, { deliveryStatus: 'completed' });
      toast.success('Receipt confirmed!');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to confirm receipt');
    } finally { setUpdatingDelivery(null); }
  };

  if (loading) return <Spinner />;

  const counts = {
    pending:  commitments.filter(c => c.status === 'pending').length,
    accepted: commitments.filter(c => c.status === 'accepted').length,
    rejected: commitments.filter(c => c.status === 'rejected').length,
    all:      commitments.length,
  };
  const filtered = filter === 'all' ? commitments : commitments.filter(c => c.status === filter);

  return (
    <div>
      <PageHeader title="Farmer Offers" subtitle="Review and manage supply offers from farmers" />

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {[
          { key: 'pending',  label: 'Pending',  count: counts.pending  },
          { key: 'accepted', label: 'Accepted', count: counts.accepted },
          { key: 'rejected', label: 'Rejected', count: counts.rejected },
          { key: 'all',      label: 'All',      count: counts.all      },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
              filter === tab.key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-xs ${filter === tab.key ? 'opacity-70' : 'text-gray-400'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={filter === 'pending' ? 'No pending offers' : 'No offers found'}
          description={filter === 'pending' ? "When farmers commit to your demands, they'll appear here for review." : ''}
        />
      ) : (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((c: any) => {
              const deliveryStatus: DeliveryStatus = c.deliveryStatus || 'pending';
              const isAccepted = c.status === 'accepted';
              const isVerified = c.farmer?.isVerified;

              return (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-600 text-sm shrink-0">
                      {c.farmer?.user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{c.farmer?.user?.name}</p>
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            <BadgeCheck size={9} /> Verified
                          </span>
                        )}
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-gray-500">
                        {c.demand?.crop?.cropName} · {c.committedQuantity} kg ·{' '}
                        <span className="font-medium text-gray-700">
                          ₦{(c.committedQuantity * (c.demand?.pricePerUnit || 0)).toLocaleString()}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.farmer?.farmLocation && `${c.farmer.farmLocation} · `}
                        {format(new Date(c.committedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    {c.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => updateStatus(c.id, 'accepted')} disabled={updating === c.id}
                          className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                          <CheckCircle size={12} /> Accept
                        </button>
                        <button onClick={() => updateStatus(c.id, 'rejected')} disabled={updating === c.id}
                          className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 transition-colors">
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Delivery status section for accepted commitments */}
                  {isAccepted && (
                    <div className="mt-3 flex items-center gap-3 pl-[52px] flex-wrap">
                      <DeliveryBadge status={deliveryStatus} />
                      {deliveryStatus === 'delivered' && (
                        <button
                          onClick={() => confirmReceipt(c.id)}
                          disabled={updatingDelivery === c.id}
                          className="flex items-center gap-1.5 text-gray-900 font-bold text-xs rounded-xl px-4 py-2"
                          style={{ background: GREEN }}>
                          <CheckCircle size={11} />
                          Confirm Receipt
                        </button>
                      )}
                      {deliveryStatus === 'completed' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-green-700">Receipt confirmed ✓</span>
                          {!(c as any).review && (
                            <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                              Leave a review for this farmer
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
