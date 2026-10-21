import { CSSProperties, lazy, startTransition, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackgroundVideo from '../components/BackgroundVideo';
import SplitChars from '../components/landing/SplitChars';
import { NAV_LINKS, edge } from '../components/landing/shared';
import { VIDEOS } from '../lib/media';

// Everything below the hero is its own chunk, fetched once the hero has painted
const loadSections = () => import('../components/landing/HomeSections');
const HomeSections = lazy(loadSections);

// The demand card in the hero only fits on wide screens; elsewhere it is never downloaded
const HeroDemand = lazy(() => import('../components/landing/HeroDemand'));
const WIDE = '(min-width: 1280px)';

// Holds the space under the hero (the crop band, then cream) until the sections arrive
const restPlaceholder = (
  <>
    <div className="h-[62px] bg-forest-950" />
    <div className="min-h-screen bg-cream-100" />
  </>
);

// Jump to a section, or let the sections scroll there themselves once they have loaded
function goTo(hash: string) {
  const el = document.querySelector(hash);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  else window.location.hash = hash;
}

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <span aria-hidden="true" className="relative inline-block h-2.5 w-3.5">
      <span className={`absolute left-0 top-0 h-px w-full bg-current transition-transform duration-300 ${open ? 'translate-y-[5px] rotate-45' : ''}`} />
      <span className={`absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-300 ${open ? '-translate-y-[4px] -rotate-45' : ''}`} />
    </span>
  );
}

function SiteMenu({ onClose }: { onClose: () => void }) {
  return (
    <div id="site-menu" className="fixed inset-0 z-40 flex animate-menu flex-col bg-forest-950 text-white">
      <nav aria-label="Sections" className={`${edge} flex flex-1 flex-col justify-center pt-16`}>
        <ul className="border-t border-white/15">
          {NAV_LINKS.map((l, i) => (
            <li key={l.href} className="animate-rise border-b border-white/15" style={{ animationDelay: `${120 + i * 60}ms` }}>
              <a href={l.href} onClick={e => { e.preventDefault(); onClose(); requestAnimationFrame(() => goTo(l.href)); }}
                className="group flex items-baseline justify-between gap-6 py-4 sm:py-5">
                <span className="font-display text-[clamp(36px,6vw,88px)] font-light leading-none tracking-[-0.035em] transition-transform duration-300 group-hover:translate-x-2">
                  {l.label}
                </span>
                <span className="micro text-white/50">0{i + 1}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className={`${edge} flex flex-wrap items-center justify-between gap-4 pb-6`}>
        <p className="micro text-white/50">Lagos, Nigeria</p>
        <div className="flex gap-2.5">
          <Link to="/login" className="fm-btn fm-btn-outline">Sign in</Link>
          <Link to="/register" className="fm-btn fm-btn-light">Create account</Link>
        </div>
      </div>
    </div>
  );
}

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

  // The headline letters wait briefly for their typeface, so they don't fade in and then change shape
  const [play, setPlay] = useState(false);

  useEffect(() => {
    let live = true;
    const go = () => { if (live) setPlay(true); };
    const timer = setTimeout(go, 900);
    document.fonts?.load('300 64px "Host Grotesk"').then(go, go);
    return () => { live = false; clearTimeout(timer); };
  }, []);

  // Paint the hero first; the sections below the fold render right after in an interruptible pass
  const [showRest, setShowRest] = useState(false);

  // The sections' code and photos would otherwise share the connection with the hero video and
  // make it stall, so they render once the video has buffered enough to play through (or the
  // page has loaded without one). Scrolling, or 6s, starts them straight away. Their code is
  // fetched early, when the video starts, so an early scroll doesn't wait on the network.
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
    const inHero = (e: Event) => (e.target as Element).closest?.('[data-hero]');
    // Media events don't bubble, but a capturing listener on the document still sees them
    const onPlaying = (e: Event) => { if (inHero(e)) loadSections().catch(() => {}); };
    const onBuffered = (e: Event) => { if (inHero(e)) start(); };
    const onLoad = () => { if (!document.querySelector('[data-hero] video')) start(); };
    const intents = ['wheel', 'touchstart', 'keydown', 'scroll'];
    document.addEventListener('playing', onPlaying, true);
    document.addEventListener('canplaythrough', onBuffered, true);
    intents.forEach(ev => window.addEventListener(ev, start, { passive: true }));
    if (document.readyState === 'complete') onLoad(); else window.addEventListener('load', onLoad, { once: true });
    const timer = setTimeout(start, 6000);
    return () => {
      document.removeEventListener('playing', onPlaying, true);
      document.removeEventListener('canplaythrough', onBuffered, true);
      intents.forEach(ev => window.removeEventListener(ev, start));
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

  // The menu covers the page: close it with Escape and stop the page scrolling underneath
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [menuOpen]);

  const solid = scrolled && !menuOpen;

  return (
    // One typeface for the whole page, in its non-swapping copy: the font is preloaded here, so
    // text waits a moment for it instead of drawing in a fallback and reflowing
    <div className="min-h-screen bg-cream-100 font-display text-forest-950"
      style={{ '--display-face': '"Host Grotesk Block"' } as CSSProperties}>

      {/* ── Header ── */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? 'border-b border-forest-900/10 bg-cream-100/95 text-forest-950 backdrop-blur-sm' : 'border-b border-transparent text-white'
      }`}>
        <div className={`${edge} grid h-16 grid-cols-[1fr_auto_1fr] items-center`}>
          <button onClick={() => setMenuOpen(o => !o)} aria-expanded={menuOpen} aria-controls="site-menu"
            className="micro flex items-center gap-2.5 justify-self-start py-2 hover:opacity-70">
            <MenuGlyph open={menuOpen} /> {menuOpen ? 'Close' : 'Menu'}
          </button>

          <Link to="/" aria-label="FarmLink home" className="font-display text-[19px] font-medium tracking-[-0.02em]">
            FarmLink
          </Link>

          <div className="flex items-center gap-5 justify-self-end">
            <Link to="/login" className="micro py-2 hover:opacity-70">Sign in</Link>
            <Link to="/register" className={`fm-btn hidden sm:inline-flex ${solid ? 'fm-btn-dark' : 'fm-btn-light'}`}>
              Create account
            </Link>
          </div>
        </div>
      </header>

      {menuOpen && <SiteMenu onClose={() => setMenuOpen(false)} />}

      {/* ── Hero ── */}
      <section data-hero className="relative isolate h-[100svh] min-h-[600px] overflow-hidden bg-forest-950 text-white">
        <div data-hero-media className="absolute inset-0 -z-10">
          <BackgroundVideo video={VIDEOS.hero} eager className="absolute inset-0 h-full w-full" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,28,20,0.55)_0%,rgba(10,28,20,0.1)_38%,rgba(10,28,20,0.15)_58%,rgba(10,28,20,0.78)_100%)]" />

        <div className={`${edge} flex h-full flex-col justify-between pb-6 pt-24 sm:pb-8 sm:pt-28`}>
          <h1 data-hero-title aria-label="Supply is complex. FarmLink fixes it." className="display-xl max-w-[12ch] sm:max-w-none">
            <SplitChars text="Supply is complex." play={play} seed={3} />
            <br />
            <SplitChars text="FarmLink fixes it." play={play} seed={7} className="text-lime-300" />
          </h1>

          <div className="flex items-end justify-between gap-10">
            {wide && (
              // Sized like the card, so nothing in the hero moves when it arrives
              <div className="mb-1 min-h-[256px] w-[340px] shrink-0">
                <Suspense fallback={null}><HeroDemand /></Suspense>
              </div>
            )}

            <div className="ml-auto w-full max-w-[420px] animate-rise" style={{ animationDelay: '450ms' }}>
              <p className="display-md">Buyers post.<br />Farmers commit.</p>
              <p className="micro mt-4 text-white/80">
                FarmLink connects verified farmers directly with hotels, restaurants, schools and NGOs.
                Both sides see the same record from order to delivery.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link to="/register" className="fm-btn fm-btn-light">Create an account</Link>
                <Link to="/login" className="fm-btn fm-btn-outline">Sign in</Link>
              </div>
            </div>
          </div>
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
