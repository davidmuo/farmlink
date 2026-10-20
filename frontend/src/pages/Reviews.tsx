import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Star, MessageSquare, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import Avatar from '../components/Avatar';
import CropThumb from '../components/CropThumb';
import EmptyState from '../components/EmptyState';
import api from '../lib/api';

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: number; name: string };
  reviewee: { id: number; name: string };
  commitmentId: number;
}

interface ReviewableCommitment {
  id: number;
  deliveryStatus: string;
  committedQuantity: number;
  demand?: { crop?: { cropName: string }; pricePerUnit: number };
  farmer?: { user?: { id: number; name: string } };
}

function Stars({ rating, interactive = false, onRate, size }: {
  rating: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const px = size ?? (interactive ? 26 : 14);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
          aria-label={interactive ? `${n} star${n > 1 ? 's' : ''}` : undefined}
        >
          <Star
            size={px}
            className={n <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-300'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export default function Reviews() {
  const { user } = useAuth();
  const [received, setReceived]       = useState<Review[]>([]);
  const [reviewable, setReviewable]   = useState<ReviewableCommitment[]>([]);
  const [avgRating, setAvgRating]     = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);

  // form state
  const [active, setActive]   = useState<ReviewableCommitment | null>(null);
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [reviewsRes, commitmentsRes] = await Promise.all([
        api.get(`/reviews/user/${user.id}`),
        api.get('/commitments'),
      ]);

      setReceived(reviewsRes.data.reviews);
      setAvgRating(reviewsRes.data.avgRating);

      // Find completed commitments that don't already have a review
      const reviewedCommitmentIds = new Set(reviewsRes.data.reviews.map((r: Review) => r.commitmentId));
      const completed = (commitmentsRes.data as ReviewableCommitment[]).filter(
        c => c.deliveryStatus === 'completed' && !reviewedCommitmentIds.has(c.id)
      );
      // Each order takes a single review, so also leave out orders the user (or the other
      // party) has already reviewed. The endpoint answers 404 when an order has no review yet.
      const unreviewed = await Promise.all(completed.map(c =>
        api.get(`/reviews/commitment/${c.id}`, { validateStatus: status => status === 200 || status === 404 })
          .then(r => r.status === 404)
          .catch(() => true)
      ));
      setReviewable(completed.filter((_, i) => unreviewed[i]));
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const handleSubmit = async () => {
    if (!active) return;
    if (rating === 0) { toast.error('Select a star rating'); return; }

    // Determine reviewee: farmer reviews buyer, buyer reviews farmer
    let revieweeId: number | undefined;
    // The commitments API includes the related user's name but not their id; the farmer and
    // buyer records carry it as userId, so fall back to that.
    if (user?.role === 'farmer') {
      revieweeId = (active as any).demand?.buyer?.user?.id ?? (active as any).demand?.buyer?.userId;
    } else {
      revieweeId = (active as any).farmer?.user?.id ?? (active as any).farmer?.userId;
    }

    if (!revieweeId) { toast.error('Could not identify the other party'); return; }

    setSaving(true);
    try {
      await api.post('/reviews', { commitmentId: active.id, rating, revieweeId, comment: comment.trim() || undefined });
      toast.success('Review submitted!');
      setActive(null);
      setRating(0);
      setComment('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const otherPartyName = (c: ReviewableCommitment) =>
    user?.role === 'farmer'
      ? (c as any).demand?.buyer?.user?.name ?? 'Buyer'
      : (c as any).farmer?.user?.name ?? 'Farmer';

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Reviews"
        subtitle={received.length > 0
          ? `${received.length} review${received.length !== 1 ? 's' : ''} · ${avgRating?.toFixed(1) ?? 'N/A'} avg`
          : 'Reviews from completed commitments'}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rating summary */}
        <div className="card h-fit p-5">
          <p className="text-sm text-gray-600">Your rating</p>
          <p className="tabular mt-1 text-4xl font-semibold tracking-tight text-gray-900">{avgRating !== null ? avgRating.toFixed(1) : 'N/A'}</p>
          <div className="mt-2"><Stars rating={Math.round(avgRating ?? 0)} size={16} /></div>
          <p className="mt-2 text-sm text-gray-500">
            {received.length > 0 ? `From ${received.length} review${received.length !== 1 ? 's' : ''}` : 'No reviews yet'}
          </p>
          {received.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {[5, 4, 3, 2, 1].map(n => {
                const count = received.filter(rv => rv.rating === n).length;
                return (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-2 text-gray-500">{n}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-forest-600" style={{ width: `${(count / received.length) * 100}%` }} />
                    </div>
                    <span className="tabular w-4 text-right text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Pending reviews to leave */}
          {reviewable.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <div>
                  <p className="card-title">Leave a review</p>
                  <p className="card-sub">{reviewable.length} completed commitment{reviewable.length !== 1 ? 's' : ''} awaiting review</p>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {reviewable.map(c => (
                  <div key={c.id}>
                    <button
                      onClick={() => { setActive(active?.id === c.id ? null : c); setRating(0); setComment(''); }}
                      className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50/80"
                    >
                      <div className="relative shrink-0">
                        <Avatar name={otherPartyName(c)} size={44} />
                        <span className="absolute -bottom-0.5 -right-0.5"><CropThumb name={c.demand?.crop?.cropName} size={20} rounded="full" className="ring-2 ring-white" /></span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">{otherPartyName(c)}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {c.demand?.crop?.cropName} · {c.committedQuantity} kg
                        </p>
                      </div>
                      <span className={`btn-sm ${active?.id === c.id ? 'btn-secondary' : 'btn-accent'}`}>
                        Review <ChevronDown size={13} className={`transition-transform ${active?.id === c.id ? 'rotate-180' : ''}`} />
                      </span>
                    </button>

                    {active?.id === c.id && (
                      <div className="animate-fade-in border-t border-gray-100 bg-gray-50/70 px-6 pb-6 pt-5">
                        <div className="mb-5">
                          <p className="label">Your rating</p>
                          <div className="flex items-center gap-3">
                            <Stars rating={rating} interactive onRate={setRating} />
                            {rating > 0 && <span className="text-sm font-medium text-gray-700">{ratingLabels[rating]}</span>}
                          </div>
                        </div>
                        <div className="mb-5">
                          <p className="label">Comment <span className="font-normal text-gray-400">(optional)</span></p>
                          <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            rows={3}
                            placeholder="Describe your experience…"
                            className="input resize-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSubmit}
                            disabled={saving || rating === 0}
                            className="btn-md btn-primary">
                            {saving ? 'Submitting…' : 'Submit review'}
                          </button>
                          <button onClick={() => setActive(null)} className="btn-md btn-ghost">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Received reviews */}
          <div className="card overflow-hidden">
            <div className="card-header">
              <p className="card-title">Reviews received</p>
            </div>

            {received.length === 0 ? (
              <EmptyState bare icon={MessageSquare} title="No reviews yet" description="Reviews appear here once commitments are completed." />
            ) : (
              <div className="divide-y divide-gray-100">
                {received.map(r => (
                  <div key={r.id} className="px-6 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.reviewer.name} size={40} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{r.reviewer.name}</p>
                          <p className="text-[11px] text-gray-500">{format(new Date(r.createdAt), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <Stars rating={r.rating} />
                    </div>
                    {r.comment && (
                      <p className="mt-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-700">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
