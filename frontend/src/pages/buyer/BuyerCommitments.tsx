import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, CheckSquare, BadgeCheck, MapPin, Star } from 'lucide-react';
import { Commitment } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
import CropThumb from '../../components/CropThumb';
import DeliveryTrack, { DeliveryStatus } from '../../components/DeliveryTrack';
import api from '../../lib/api';
import { useNotifications } from '../../context/NotificationContext';

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
      <PageHeader title="Farmer Offers" subtitle="Review and manage supply offers from farmers." />

      <div className="tabs mb-6">
        {[
          { key: 'pending',  label: 'Pending',  count: counts.pending  },
          { key: 'accepted', label: 'Accepted', count: counts.accepted },
          { key: 'rejected', label: 'Rejected', count: counts.rejected },
          { key: 'all',      label: 'All',      count: counts.all      },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)} className={`tab ${filter === tab.key ? 'tab-active' : ''}`}>
            {tab.label}
            {tab.count > 0 && (
              <span className="tab-count">{tab.count}</span>
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
        <div className="space-y-3">
          {filtered.map((c: any) => {
            const deliveryStatus: DeliveryStatus = c.deliveryStatus || 'pending';
            const isAccepted = c.status === 'accepted';
            const isVerified = c.farmer?.isVerified;

            return (
              <div key={c.id} className="card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="relative shrink-0">
                      <Avatar name={c.farmer?.user?.name} size={52} />
                      <span className="absolute -bottom-1 -right-1"><CropThumb name={c.demand?.crop?.cropName} size={24} rounded="full" className="ring-2 ring-white" /></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-[15px] font-semibold text-gray-900">{c.farmer?.user?.name}</p>
                        {isVerified && (
                          <span className="badge-green"><BadgeCheck size={12} /> Verified</span>
                        )}
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-sm text-gray-700">
                        {c.demand?.crop?.cropName} · {c.committedQuantity} kg ·{' '}
                        <span className="tabular font-semibold text-gray-900">
                          ₦{(c.committedQuantity * (c.demand?.pricePerUnit || 0)).toLocaleString()}
                        </span>
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500">
                        {c.farmer?.farmLocation && <span className="inline-flex items-center gap-1"><MapPin size={11} />{c.farmer.farmLocation} ·</span>}
                        {format(new Date(c.committedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  {c.status === 'pending' && (
                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => updateStatus(c.id, 'accepted')} disabled={updating === c.id} className="btn-md btn-primary">
                        <CheckCircle size={14} /> Accept
                      </button>
                      <button onClick={() => updateStatus(c.id, 'rejected')} disabled={updating === c.id} className="btn-md btn-secondary">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>

                {isAccepted && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="overflow-x-auto scrollbar-hide"><DeliveryTrack status={deliveryStatus} /></div>
                    {deliveryStatus === 'delivered' && (
                      <button
                        onClick={() => confirmReceipt(c.id)}
                        disabled={updatingDelivery === c.id}
                        className="btn-md btn-accent shrink-0">
                        <CheckCircle size={14} /> Confirm receipt
                      </button>
                    )}
                    {deliveryStatus === 'completed' && (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700"><CheckCircle size={13} /> Receipt confirmed</span>
                        {!(c as any).review && (
                          <span className="badge-amber">
                            <Star size={11} /> Leave a review for this farmer
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
      )}
    </div>
  );
}
