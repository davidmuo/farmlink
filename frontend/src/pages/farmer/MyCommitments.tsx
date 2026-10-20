import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ClipboardList, XCircle, ChevronRight, Truck, AlertTriangle, CheckCircle, CalendarDays, PackageCheck } from 'lucide-react';
import { Commitment } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import CropThumb from '../../components/CropThumb';
import DeliveryTrack, { DeliveryStatus } from '../../components/DeliveryTrack';
import api from '../../lib/api';

const fmt = (n: number) =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `₦${(n / 1_000).toFixed(0)}k`
  : `₦${n.toLocaleString()}`;

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
      toast.success('Issue reported. An admin will review it.');
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
      <PageHeader title="My Commitments" subtitle="Track your supply commitments to buyers." />

      {totalEarnings > 0 && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm text-gray-600">Confirmed earnings</p>
            <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-gray-900">{fmt(totalEarnings)}</p>
          </div>
          <span className="badge-green">
            <PackageCheck size={14} /> {counts.accepted} accepted
          </span>
        </div>
      )}

      <div className="tabs mb-6">
        {Object.entries(counts).map(([key, count]) => (
          <button key={key} onClick={() => setFilter(key)} className={`tab ${filter === key ? 'tab-active' : ''}`}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
            {count > 0 && (
              <span className="tab-count">{count}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No commitments here"
          description="Browse open demands and commit to supply what you grow."
          action={<Link to="/farmer/demands" className="btn-md btn-accent">Browse demands</Link>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const value = c.committedQuantity * (c.demand?.pricePerUnit || 0);
            const deliveryStatus: DeliveryStatus = (c as any).deliveryStatus || 'pending';
            const isAccepted = c.status === 'accepted';

            return (
              <div key={c.id} className="card p-5">
                <div className="flex items-center gap-4">
                  <CropThumb name={c.demand?.crop?.cropName} size={52} rounded="2xl" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold text-gray-900">{c.demand?.crop?.cropName}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="truncate text-xs text-gray-500">
                      {(c.demand as any)?.buyer?.businessName || (c.demand as any)?.buyer?.user?.name} · {c.committedQuantity} kg · ₦{c.demand?.pricePerUnit}/kg
                    </p>
                    {c.status === 'accepted' && c.demand?.deliveryEnd && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-forest-700">
                        <CalendarDays size={12} /> Deliver by {format(new Date(c.demand.deliveryEnd), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className="tabular text-sm font-semibold text-gray-900">{fmt(value)}</p>
                    <p className="text-xs text-gray-500">{format(new Date(c.committedAt), 'MMM d')}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {c.status === 'pending' && (
                      <button onClick={() => cancel(c.id)} disabled={cancelling === c.id} title="Cancel commitment"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
                        <XCircle size={16} />
                      </button>
                    )}
                    <Link to={`/farmer/demands/${c.demandId}`} title="View demand"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>

                {isAccepted && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                      <div className="overflow-x-auto scrollbar-hide"><DeliveryTrack status={deliveryStatus} /></div>
                      <div className="flex items-center gap-2 lg:ml-auto">
                        {deliveryStatus === 'pending' && (
                          <button
                            onClick={() => updateDelivery(c.id, 'in_transit')}
                            disabled={updatingDelivery === c.id}
                            className="btn-sm btn-accent">
                            <Truck size={13} /> Mark as in transit
                          </button>
                        )}
                        {deliveryStatus === 'in_transit' && (
                          <button
                            onClick={() => updateDelivery(c.id, 'delivered')}
                            disabled={updatingDelivery === c.id}
                            className="btn-sm btn-accent">
                            <CheckCircle size={13} /> Mark as delivered
                          </button>
                        )}
                        {(deliveryStatus === 'delivered' || deliveryStatus === 'completed') && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700"><CheckCircle size={13} /> Delivered</span>
                        )}
                        <button
                          onClick={() => setReportingDispute(reportingDispute === c.id ? null : c.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600">
                          <AlertTriangle size={12} /> Report issue
                        </button>
                      </div>
                    </div>

                    {reportingDispute === c.id && (
                      <div className="animate-fade-in space-y-2.5 rounded-2xl bg-red-50/50 p-4 ring-1 ring-red-100">
                        <textarea
                          value={disputeText[c.id] || ''}
                          onChange={e => setDisputeText(p => ({ ...p, [c.id]: e.target.value }))}
                          rows={2}
                          placeholder="Describe the issue briefly…"
                          className="input resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitDispute(c.id)}
                            disabled={submittingDispute === c.id}
                            className="btn-sm btn-primary">
                            {submittingDispute === c.id ? 'Sending…' : 'Submit report'}
                          </button>
                          <button onClick={() => setReportingDispute(null)} className="btn-sm btn-ghost">
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
      )}
    </div>
  );
}
