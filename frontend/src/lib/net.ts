// What the visitor's connection can comfortably handle.
//  full: desktop-quality media    lite: phone/3G renditions    none: stills only (2G or Data Saver)
export type ConnectionTier = 'full' | 'lite' | 'none';

export function connectionTier(): ConnectionTier {
  const c = (navigator as any).connection;
  if (c?.saveData) return 'none';
  const t: string | undefined = c?.effectiveType;
  if (t === 'slow-2g' || t === '2g') return 'none';
  if (t === '3g') return 'lite';
  return 'full';
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Phones and slower connections get the small renditions
export const prefersSmallMedia = () =>
  typeof window !== 'undefined' && (window.innerWidth < 768 || connectionTier() !== 'full');
