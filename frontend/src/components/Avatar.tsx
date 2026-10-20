import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { avatarUrl, avatarSrcSet } from '../lib/media';

interface Props {
  name?: string | null;
  size?: number;
  className?: string;
  ring?: boolean;
  rounded?: 'full' | 'xl' | '2xl';
}

export default function Avatar({ name, size = 36, className = '', ring = false, rounded = 'full' }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const radius = rounded === 'full' ? 'rounded-full' : rounded === 'xl' ? 'rounded-xl' : 'rounded-2xl';

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden bg-gray-100 ${radius} ${ring ? 'ring-2 ring-white' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      {failed ? (
        <UserRound className="m-auto text-gray-400" size={Math.round(size * 0.55)} strokeWidth={1.75} />
      ) : (
        <img
          src={avatarUrl(name, size)}
          srcSet={avatarSrcSet(name, size)}
          crossOrigin="anonymous"
          alt={name ? `${name}` : 'Profile photo'}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </span>
  );
}
