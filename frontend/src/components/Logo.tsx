import { Link } from 'react-router-dom';

interface Props {
  tone?: 'dark' | 'light';
  to?: string | null;
  className?: string;
}

// The product name, set as plain text
export default function Logo({ tone = 'dark', to = '/', className = '' }: Props) {
  const content = (
    <span className={`font-display text-[18px] font-medium tracking-[-0.02em] ${tone === 'light' ? 'text-white' : 'text-gray-900'} ${className}`}>
      FarmLink
    </span>
  );
  return to ? <Link to={to} aria-label="FarmLink home">{content}</Link> : content;
}
