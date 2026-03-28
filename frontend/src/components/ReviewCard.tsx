import { format } from 'date-fns';
import ReviewStars from './ReviewStars';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: { name: string };
}

interface Props { review: Review; }

export default function ReviewCard({ review }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{review.reviewer.name}</p>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          {format(new Date(review.createdAt), 'MMM d, yyyy')}
        </p>
      </div>
      <ReviewStars rating={review.rating} size={14} />
      {review.comment && (
        <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}
