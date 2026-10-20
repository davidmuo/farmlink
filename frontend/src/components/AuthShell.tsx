import { ReactNode } from 'react';
import Logo from './Logo';
import { pexels, pexelsSrcSet } from '../lib/media';

interface Props {
  children: ReactNode;
  photo: number;
  photoAlt: string;
  headline: ReactNode;
  caption: string;
  topRight?: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({ children, photo, photoAlt, headline, caption, topRight, footer }: Props) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-4 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Logo />
          {topRight}
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>

        {footer && <div className="text-center text-xs text-gray-500">{footer}</div>}
      </div>

      <div className="relative hidden lg:block">
        <div className="sticky top-0 h-screen overflow-hidden bg-forest-950">
          {/* The panel is hidden below lg, so give small screens a 1px stand-in instead of a photo download */}
          <picture>
            <source media="(max-width: 1023px)" srcSet="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" />
            <img src={pexels(photo, 1280)} srcSet={pexelsSrcSet(photo, [720, 960, 1280, 1600])} sizes="50vw" alt={photoAlt}
              crossOrigin="anonymous" decoding="async" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="max-w-md text-2xl font-semibold leading-snug">{headline}</p>
            <p className="mt-2 max-w-sm text-sm text-white/80">{caption}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
