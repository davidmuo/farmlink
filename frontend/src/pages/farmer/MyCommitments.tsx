import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ClipboardList, XCircle, ChevronRight, Wheat, Truck, AlertTriangle } from 'lucide-react';
import { Commitment } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import api from '../../lib/api';

const GREEN = '#6DFF8A';

const fmt = (n: number) =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `₦${(n / 1_000).toFixed(0)}k`
  : `₦${n.toLocaleString()}`;

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

export default function MyCommitments() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [updatingDelivery, setUpdatingDelivery] = useState<number | null>(null);
  const [reportingDispute, setReportingDispute] = useState<number | null>(null);
  const [disputeText, setDisputeText] = useState<Record<number, string>>({});
  const [submittingDispute, setSubmittingDispute] = useState<number | null>(null);

  const load = () => api.get('/commitments').then(r => setCommitments(r.data));
  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const cancel = async (id: number) => {
    if (!confirm('Cancel this commitment? This cannot be undone.')) return;
    setCancelling(id);
    try {
      await api.patch(`/commitments/${id}/cancel`);
      toast.success('Commitment cancelled');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Cannot cancel this commitment');
    } finally { setCancelling(null); }
  };

  const updateDelivery = async (id: number, deliveryStatus: DeliveryStatus) => {
    setUpdatingDelivery(id);
    try {
      await api.patch(`/commitments/${id}/delivery`, { deliveryStatus });
      toast.success(
        deliveryStatus === 'in_transit' ? 'Marked as in transit' : 'Marked as delivered'
      );
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update delivery status');
    } finally { setUpdatingDelivery(null); }
  };

  const submitDispute = async (commitmentId: number) => {
    const reason = disputeText[commitmentId]?.trim();
    if (!reason) { toast.error('Describe the issue first'); return; }
    setSubmittingDispute(commitmentId);
    try {
      await api.post('/disputes', { commitmentId, reason });
      toast.success('Issue reported — an admin will review it');
      setReportingDispute(null);
      setDisputeText(p => ({ ...p, [commitmentId]: '' }));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit dispute');
    } finally { setSubmittingDispute(null); }
  };

  if (loading) return <Spinner />;

  const counts = {
    all:      commitments.length,
    pending:  commitments.filter(c => c.status === 'pending').length,
    accepted: commitments.filter(c => c.status === 'accepted').length,
    rejected: commitments.filter(c => c.status === 'rejected').length,
  };

  const totalEarnings = commitments.filter(c => c.status === 'accepted')
    .reduce((s, c) => s + c.committedQuantity * (c.demand?.pricePerUnit || 0), 0);

  const filtered = filter === 'all' ? commitments : commitments.filter(c => c.status === filter);

  return (
    <div>
      <PageHeader title="My Commitments" subtitle="Track your supply commitments to buyers" />

      {totalEarnings > 0 && (
        <div className="border border-gray-100 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Confirmed earnings</p>
            <p className="text-xl font-black text-gray-900 tracking-tight">{fmt(totalEarnings)}</p>
          </div>
          <p className="text-xs text-gray-400">{counts.accepted} accepted</p>
        </div>
      )}

      <div className="flex gap-1.5 mb-5 flex-wrap">
        {Object.entries(counts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
              filter === key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
            {count > 0 && (
              <span className={`ml-1.5 text-xs ${filter === key ? 'opacity-70' : 'text-gray-400'}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No commitments here"
          description="Browse open demands and commit to supply what you grow."
          action={<Link to="/farmer/demands" className="btn-md btn-primary">Browse demands</Link>}
        />
      ) : (
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map(c => {
              const value = c.committedQuantity * (c.demand?.pricePerUnit || 0);
              const deliveryStatus: DeliveryStatus = (c as any).deliveryStatus || 'pending';
              const isAccepted = c.status === 'accepted';

              return (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0">
                      <Wheat size={14} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 text-sm">{c.demand?.crop?.cropName}</p>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="text-xs text-gray-400">
                        {(c.demand as any)?.buyer?.businessName || (c.demand as any)?.buyer?.user?.name} · {c.committedQuantity} kg · ₦{c.demand?.pricePerUnit}/kg
                      </p>
                      {c.status === 'accepted' && c.demand?.deliveryEnd && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Deliver by {format(new Date(c.demand.deliveryEnd), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{fmt(value)}</p>
                      <p className="text-xs text-gray-400">{format(new Date(c.committedAt), 'MMM d')}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link to={`/farmer/demands/${c.demandId}`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <ChevronRight size={14} />
                      </Link>
                      {c.status === 'pending' && (
                        <button onClick={() => cancel(c.id)} disabled={cancelling === c.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isAccepted && (
                    <div className="mt-3 flex flex-col gap-2 pl-[52px]">
                      <div className="flex items-center gap-3">
                        <DeliveryBadge status={deliveryStatus} />
                        {deliveryStatus === 'pending' && (
                          <button
                            onClick={() => updateDelivery(c.id, 'in_transit')}
                            disabled={updatingDelivery === c.id}
                            className="flex items-center gap-1.5 text-gray-900 font-bold text-xs rounded-xl px-4 py-2"
                            style={{ background: GREEN }}>
                            <Truck size={11} />
                            Mark as In Transit
                          </button>
                        )}
                        {deliveryStatus === 'in_transit' && (
                          <button
                            onClick={() => updateDelivery(c.id, 'delivered')}
                            disabled={updatingDelivery === c.id}
                            className="flex items-center gap-1.5 text-gray-900 font-bold text-xs rounded-xl px-4 py-2"
                            style={{ background: GREEN }}>
                            Mark as Delivered
                          </button>
                        )}
                        {(deliveryStatus === 'delivered' || deliveryStatus === 'completed') && (
                          <span className="text-xs font-semibold text-green-700">Delivered ✓</span>
                        )}
                        <button
                          onClick={() => setReportingDispute(reportingDispute === c.id ? null : c.id)}
                          className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors">
                          <AlertTriangle size={11} /> Report issue
                        </button>
                      </div>

                      {reportingDispute === c.id && (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={disputeText[c.id] || ''}
                            onChange={e => setDisputeText(p => ({ ...p, [c.id]: e.target.value }))}
                            rows={2}
                            placeholder="Describe the issue briefly…"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => submitDispute(c.id)}
                              disabled={submittingDispute === c.id}
                              className="text-xs font-bold px-4 py-1.5 rounded-xl text-gray-900 disabled:opacity-40"
                              style={{ background: GREEN }}>
                              {submittingDispute === c.id ? 'Sending…' : 'Submit'}
                            </button>
                            <button
                              onClick={() => setReportingDispute(null)}
                              className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-2">
                              Cancel
                            </button>
                          </div>
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
