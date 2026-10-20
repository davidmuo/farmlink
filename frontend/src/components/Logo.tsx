import { Link } from 'react-router-dom';

interface Props {
  tone?: 'dark' | 'light';
  to?: string | null;
  className?: string;
}

// The product name, set as plain text
export default function Logo({ tone = 'dark', to = '/', className = '' }: Props) {
  const content = (
    <span className={`text-[17px] font-semibold tracking-tight ${tone === 'light' ? 'text-white' : 'text-gray-900'} ${className}`}>
      FarmLink
    </span>
  );
  return to ? <Link to={to} aria-label="FarmLink home">{content}</Link> : content;
}
