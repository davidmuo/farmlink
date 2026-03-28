import { useState } from 'react';
import { Star } from 'lucide-react';

const GREEN = '#6DFF8A';

interface Props {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}

export default function ReviewStars({ rating, size = 16, interactive = false, onChange }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  const effective = hovered !== null ? hovered : rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(null)}
          className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
          style={{ lineHeight: 1, background: 'none', border: 'none', padding: 0 }}
        >
          <Star
            size={size}
            fill={i <= effective ? GREEN : '#e5e7eb'}
            stroke={i <= effective ? GREEN : '#e5e7eb'}
          />
        </button>
      ))}
    </div>
  );
}
