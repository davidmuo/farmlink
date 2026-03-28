import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Star, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import api from '../lib/api';

const GREEN = '#6DFF8A';

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

function Stars({ rating, interactive = false, onRate }: {
  rating: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  const [hover, setHover] = useState(0);
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
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={interactive ? 20 : 14}
            fill={n <= (hover || rating) ? GREEN : 'none'}
            stroke={n <= (hover || rating) ? GREEN : '#d1d5db'}
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
      setReviewable(completed);
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
    if (user?.role === 'farmer') {
      revieweeId = (active as any).demand?.buyer?.user?.id;
    } else {
      revieweeId = (active as any).farmer?.user?.id;
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

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Reviews"
        subtitle={received.length > 0
          ? `${received.length} review${received.length !== 1 ? 's' : ''} · ${avgRating?.toFixed(1) ?? '—'} avg`
          : 'Reviews from completed commitments'}
      />

      <div className="space-y-5">

        {/* Pending reviews to leave */}
        {reviewable.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <p className="font-bold text-gray-900">Leave a review</p>
              <p className="text-xs text-gray-400 mt-0.5">{reviewable.length} completed commitment{reviewable.length !== 1 ? 's' : ''} awaiting review</p>
            </div>
            <div className="divide-y divide-gray-50">
              {reviewable.map(c => (
                <div key={c.id}>
                  <button
                    onClick={() => { setActive(active?.id === c.id ? null : c); setRating(0); setComment(''); }}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ fontFamily: "'Syne', sans-serif" }}>
                      {otherPartyName(c).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{otherPartyName(c)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.demand?.crop?.cropName} · {c.committedQuantity} kg
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-xl text-gray-900"
                      style={{ background: GREEN }}>
                      Review
                    </span>
                  </button>

                  {active?.id === c.id && (
                    <div className="px-6 pb-5 border-t border-gray-50 pt-4 bg-gray-50/50">
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Your rating</p>
                        <Stars rating={rating} interactive onRate={setRating} />
                      </div>
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Comment <span className="text-gray-300 font-normal">(optional)</span></p>
                        <textarea
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          rows={3}
                          placeholder="Describe your experience…"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleSubmit}
                          disabled={saving || rating === 0}
                          className="inline-flex items-center gap-2 font-semibold text-sm px-5 rounded-xl text-gray-950 hover:opacity-90 transition-opacity disabled:opacity-40"
                          style={{ background: GREEN, height: 38 }}>
                          {saving ? 'Submitting…' : 'Submit review'}
                        </button>
                        <button
                          onClick={() => setActive(null)}
                          className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
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
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">Reviews received</p>
              {avgRating !== null && (
                <div className="flex items-center gap-2 mt-1">
                  <Stars rating={Math.round(avgRating)} />
                  <span className="text-sm font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">from {received.length} review{received.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          {received.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <MessageSquare size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No reviews yet.</p>
              <p className="text-xs text-gray-300 mt-1">Reviews appear here once commitments are completed.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {received.map(r => (
                <div key={r.id} className="px-6 py-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0"
                        style={{ fontFamily: "'Syne', sans-serif" }}>
                        {r.reviewer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{r.reviewer.name}</p>
                        <p className="text-[10px] text-gray-400">{format(new Date(r.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-500 leading-relaxed mt-2 pl-11">{r.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
