import { useState } from 'react';
import { Sprout } from 'lucide-react';
import { cropPhotoUrl, cropPhotoSrcSet } from '../lib/media';

interface Props {
  name?: string | null;
  size?: number;
  className?: string;
  rounded?: 'lg' | 'xl' | '2xl' | 'full';
}

export default function CropThumb({ name, size = 40, className = '', rounded = 'xl' }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const url = cropPhotoUrl(name, size);
  const radius = { lg: 'rounded-lg', xl: 'rounded-xl', '2xl': 'rounded-2xl', full: 'rounded-full' }[rounded];

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden bg-gray-100 ${radius} ${className}`}
      style={{ width: size, height: size }}
    >
      {url && !failed ? (
        <img
          src={url}
          srcSet={cropPhotoSrcSet(name, size)}
          crossOrigin="anonymous"
          alt={name ?? 'Crop'}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <Sprout className="m-auto text-gray-400" size={Math.round(size * 0.5)} strokeWidth={1.75} />
      )}
      <span className={`pointer-events-none absolute inset-0 ${radius} ring-1 ring-inset ring-black/5`} />
    </span>
  );
}
