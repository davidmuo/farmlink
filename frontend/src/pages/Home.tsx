import { lazy, startTransition, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundVideo from '../components/BackgroundVideo';
import { NAV_LINKS, container } from '../components/landing/shared';
import { VIDEOS } from '../lib/media';

// Everything below the hero is its own chunk, fetched once the hero has painted
const loadSections = () => import('../components/landing/HomeSections');
const HomeSections = lazy(loadSections);

// The demand card beside the headline only fits on wide screens; elsewhere it is never downloaded
const HeroDemand = lazy(() => import('../components/landing/HeroDemand'));
const WIDE = '(min-width: 1280px)';

// Holds the space under the hero (the crop band, then white) until the sections arrive
const restPlaceholder = (
  <>
    <div className="h-[62px] bg-forest-950" />
    <div className="min-h-screen bg-white" />
  </>
);

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches);

  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Paint the hero first; the sections below the fold render right after in an interruptible pass
  const [showRest, setShowRest] = useState(false);

  // On slow connections the sections' code and crop photos would compete with the hero video,
  // so they wait until it plays (or the page has loaded without one), at most 3s
  useEffect(() => {
    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      loadSections().catch(() => {});
      startTransition(() => setShowRest(true));
    };
    // A link straight to a section should not wait
    if (window.location.hash) {
      const id = requestAnimationFrame(() => setTimeout(start, 0));
      return () => cancelAnimationFrame(id);
    }
    const onLoad = () => { if (!document.querySelector('video')) start(); };
    // Media events don't bubble, but a capturing listener on the document still sees them
    document.addEventListener('playing', start, { capture: true, once: true });
    if (document.readyState === 'complete') onLoad(); else window.addEventListener('load', onLoad, { once: true });
    const timer = setTimeout(start, 3000);
    return () => {
      document.removeEventListener('playing', start, { capture: true });
      window.removeEventListener('load', onLoad);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const solid = scrolled || menuOpen;

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Header ── */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        solid ? 'border-b border-gray-200 bg-white' : 'border-b border-transparent bg-transparent'
      }`}>
        <div className={`${container} flex h-16 items-center justify-between`}>
          <Logo tone={solid ? 'dark' : 'light'} />

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href}
                className={`text-sm transition-colors ${solid ? 'text-gray-600 hover:text-gray-900' : 'text-white/85 hover:text-white'}`}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login"
              className={`hidden h-9 items-center rounded-lg px-3 text-sm font-medium sm:inline-flex ${
                solid ? 'text-gray-800 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}>
              Sign in
            </Link>
            <Link to="/register"
              className={`hidden h-9 items-center rounded-lg px-3.5 text-sm font-medium sm:inline-flex ${
                solid ? 'bg-forest-800 text-white hover:bg-forest-700' : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}>
              Create account
            </Link>
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className={`flex h-10 w-10 items-center justify-center rounded-lg md:hidden ${
                solid ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-gray-200 bg-white md:hidden">
            <nav className={`${container} flex flex-col py-2`}>
              {NAV_LINKS.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                  className="border-b border-gray-100 py-3 text-base text-gray-800 last:border-b-0">
                  {l.label}
                </a>
              ))}
            </nav>
            <div className={`${container} grid grid-cols-2 gap-2 pb-4`}>
              <Link to="/login" className="btn-lg btn-secondary">Sign in</Link>
              <Link to="/register" className="btn-lg btn-primary">Create account</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-forest-950 text-white sm:min-h-[640px] lg:min-h-[88vh]">
        <BackgroundVideo video={VIDEOS.hero} eager className="absolute inset-0 -z-10 h-full w-full" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950/90 via-forest-950/50 to-forest-950/40" />

        <div className={`${container} flex items-end justify-between gap-12 pb-14 pt-28 sm:pb-20`}>
          <div className="max-w-2xl">
            <h1 className="text-[36px] font-semibold leading-[1.05] tracking-[-0.025em] text-white sm:text-[52px] lg:text-[64px] xl:text-[72px]">
              Supply is complex.<br /><span className="text-lime-300">FarmLink fixes it.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">
              FarmLink connects verified farmers directly with hotels, restaurants, schools and NGOs.
              Buyers post what they need, farmers commit supply, and both sides see the same record
              from order to delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-xl bg-white text-gray-900 hover:bg-gray-100">
                Create an account
              </Link>
              <Link to="/login" className="btn-xl border border-white/50 text-white hover:bg-white/10">
                Sign in
              </Link>
            </div>
          </div>

          {wide && (
            <div className="mb-14 shrink-0">
              <Suspense fallback={null}><HeroDemand /></Suspense>
            </div>
          )}
        </div>
      </section>

      {showRest ? (
        <Suspense fallback={restPlaceholder}>
          <HomeSections />
        </Suspense>
      ) : restPlaceholder}
    </div>
  );
}
