import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Truck } from 'lucide-react';
import BackgroundVideo from '../BackgroundVideo';
import CropTicker from './CropTicker';
import SplitHeading from './SplitHeading';
import HowItWorks from './HowItWorks';
import UssdPhone from './UssdPhone';
import FeatureBento from './FeatureBento';
import { NAV_LINKS, edge } from './shared';
import { setupReveals } from './reveal';
import { PHOTOS, VIDEOS, pexels, pexelsSrcSet } from '../../lib/media';

// A notification laid over a section video, styled like the in-app toasts
function VideoNote({ icon: Icon, title, sub, className = '' }: { icon: typeof Bell; title: string; sub: string; className?: string }) {
  return (
    <div className={`flex w-full max-w-[300px] items-center gap-3 rounded-[6px] bg-white p-3 text-gray-900 shadow-float ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-forest-50 text-forest-700"><Icon size={17} /></span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  );
}

const FARMER_FACTS = [
  { big: <>Free</>,                                       label: 'To join and sell as a farmer' },
  { big: <><span data-count="3">3</span> steps</>,        label: 'From open demand to delivered order' },
  { big: <>Direct</>,                                     label: 'No brokers or market agents in between' },
  { big: <span className="font-mono tracking-[-0.06em]">*384*1#</span>, label: 'Browse and commit from any phone' },
];

const CODES = [
  { code: '*384*1#',    text: 'Dial to browse demands that match your crops' },
  { code: 'ACCEPT FL1', text: 'Reply to an alert to commit. Add a kg amount for part of the order.' },
  { code: 'STATUS',     text: 'Check your orders from any phone' },
];

// Photos and plain squares for the closing call to action. Positions are percentages of the
// mosaic box; each tile drifts at its own speed as the page scrolls.
const MOSAIC: { photo?: number; alt?: string; tone?: string; box: string; drift: number }[] = [
  { tone: 'bg-forest-600',                                      box: 'left-[34%] top-0 w-[11%] aspect-square',     drift: 14 },
  { photo: PHOTOS.cassavaHarvest, alt: 'Cassava harvest team',  box: 'right-0 top-[2%] w-[30%] aspect-[4/3]',      drift: 6 },
  { photo: PHOTOS.tomatoFarmer,   alt: 'Farmer holding fresh tomatoes', box: 'left-0 top-[16%] w-[32%] aspect-square', drift: 10 },
  { photo: PHOTOS.harvestBasket,  alt: 'Farmer carrying a harvest basket', box: 'left-[38%] top-[30%] w-[38%] aspect-[4/5]', drift: 4 },
  { tone: 'bg-forest-900',                                      box: 'right-0 bottom-[6%] w-[17%] aspect-square',  drift: 12 },
  { tone: 'bg-lime-300/25',                                     box: 'left-[22%] bottom-[2%] w-[12%] aspect-square', drift: 18 },
];

export default function HomeSections() {
  const root = useRef<HTMLDivElement>(null);

  // Slide-ins and counters are prepared before the first paint, while the sections are still off screen
  useLayoutEffect(() => (root.current ? setupReveals(root.current) : undefined), []);

  // GSAP (the scroll-linked parallax) loads once the browser is idle, so it doesn't stall the first frames
  useEffect(() => {
    const scope = root.current;
    if (!scope) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const start = () => {
      import('./motion').then(m => { if (!cancelled) cleanup = m.setupLandingMotion(scope); }).catch(() => {});
    };
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const idle = hasIdle ? window.requestIdleCallback(start, { timeout: 1500 }) : window.setTimeout(start, 600);
    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(idle); else window.clearTimeout(idle);
      cleanup?.();
    };
  }, []);

  // Links like /#for-farmers land before these sections exist, so scroll once they do
  useEffect(() => {
    if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView();
  }, []);

  return (
    <div ref={root}>
      <CropTicker />

      <HowItWorks edge={edge} />

      {/* ── For buyers: full-bleed video, headline top left, detail bottom right ── */}
      <section id="for-buyers" className="relative isolate scroll-mt-16 overflow-hidden bg-forest-950 text-white">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div data-parallax="6" className="absolute inset-x-0 -inset-y-[8%]">
            <BackgroundVideo video={VIDEOS.buyers} label="Sacks of harvested maize ready for buyers" className="absolute inset-0 h-full w-full" />
          </div>
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,28,20,0.7)_0%,rgba(10,28,20,0.2)_40%,rgba(10,28,20,0.35)_62%,rgba(10,28,20,0.88)_100%)]" />

        <div className={`${edge} flex min-h-[100svh] flex-col justify-between gap-16 py-24 sm:py-28`}>
          <div>
            <p className="micro text-lime-300">For hotels, restaurants, schools and NGOs</p>
            <SplitHeading lines={['Post once.', 'Get committed supply.']} className="display-lg mt-5" />
          </div>

          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <VideoNote icon={Truck} title="Maize, 2,000 kg in transit" sub="To Lagos Food Bank Initiative, Ikeja" className="order-2 lg:order-1" />
            <div data-rise className="order-1 max-w-[460px] lg:order-2">
              <p className="micro text-white/80">
                Describe exactly what you need: crop, quantity, quality grade and delivery window. Verified
                farmers commit to your specification. Review the offers, accept the best ones, and track every delivery.
              </p>
              <ul className="mt-6 divide-y divide-white/15 border-y border-white/15">
                {[
                  'No brokers or market agents in between',
                  'The price is visible on every demand',
                  'A record of every commitment and delivery',
                  'Recurring orders for regular kitchen needs',
                ].map(t => (
                  <li key={t} className="flex items-center gap-3 py-3 text-[15px] text-white/90">
                    <Check size={15} className="shrink-0 text-lime-300" /> {t}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="fm-btn fm-btn-light mt-7">Post a demand</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── For farmers: video on one half, headline and facts on the other ── */}
      <section id="for-farmers" className="grid scroll-mt-16 bg-cream-100 text-forest-950 lg:grid-cols-2">
        <div className="relative isolate min-h-[72svh] overflow-hidden bg-forest-900 lg:min-h-[100svh]">
          <div data-parallax="5" className="absolute inset-x-0 -inset-y-[7%]">
            <BackgroundVideo video={VIDEOS.farmer} label="A farmer checking his crops" className="absolute inset-0 h-full w-full" />
          </div>
          <VideoNote icon={Bell} title="New demand for your crops" sub="Peppers, 200 kg at ₦600/kg" className="absolute bottom-5 left-5 right-5 sm:right-auto" />
        </div>

        <div className={`${edge} flex flex-col justify-between gap-14 py-20 lg:py-24`}>
          <div>
            <p className="micro text-forest-700">For farmers</p>
            <SplitHeading lines={['Sell what you grow, directly.']} className="display-lg mt-5 max-w-[12ch]" />
            <p data-rise className="micro mt-6 max-w-[48ch] text-forest-900/75">
              Browse open demands from verified buyers. Commit to supply what you already grow at a clear
              price, and track every step from the field to payment.
            </p>
          </div>

          <div>
            <dl data-stagger className="border-t border-forest-900/15">
              {FARMER_FACTS.map(f => (
                <div key={f.label} className="flex items-end justify-between gap-6 border-b border-forest-900/15 py-4">
                  <dt className="font-display text-[clamp(34px,3.4vw,56px)] font-light leading-none tracking-[-0.03em]">{f.big}</dt>
                  <dd className="micro max-w-[24ch] text-right text-forest-900/65">{f.label}</dd>
                </div>
              ))}
            </dl>
            <Link to="/register" className="fm-btn fm-btn-dark mt-8">Join as a farmer</Link>
          </div>
        </div>
      </section>

      {/* ── Any phone ── */}
      <section id="any-phone" className="scroll-mt-16 overflow-hidden bg-forest-800 text-white">
        {/* Headline top left, the handset in the middle, the codes bottom right */}
        <div className={`${edge} grid min-h-[100svh] gap-14 py-20 sm:py-24 lg:grid-cols-[1fr_auto_1fr] lg:gap-10`}>
          <div className="lg:self-start">
            <p className="micro text-lime-300">USSD and SMS</p>
            <SplitHeading lines={['No smartphone needed.']}
              className="mt-5 font-display text-[clamp(40px,4.6vw,84px)] font-light leading-[0.98] tracking-[-0.035em]" />
            <p data-rise className="micro mt-6 max-w-[42ch] text-white/75">
              Farmers can browse demands, commit supply and check their orders by dialling a short code or
              replying to an SMS. It works on any handset, without mobile data.
            </p>
          </div>

          <figure data-rise className="justify-self-center lg:self-center">
            <UssdPhone />
            <figcaption className="micro mt-4 text-center text-white/50">A FarmLink session on a basic handset</figcaption>
          </figure>

          <dl data-stagger className="border-t border-white/15 lg:self-end">
            {CODES.map(r => (
              <div key={r.code} className="border-b border-white/15 py-5">
                <dt className="font-mono text-[clamp(26px,2.4vw,38px)] leading-none tracking-[-0.04em]">{r.code}</dt>
                <dd className="micro mt-2.5 max-w-[40ch] text-white/65">{r.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <FeatureBento edge={edge} />

      {/* ── Call to action: copy on the left, a drifting photo mosaic on the right ── */}
      <section className="overflow-hidden bg-forest-700 text-white">
        <div className={`${edge} grid min-h-[92svh] gap-14 py-20 lg:grid-cols-2 lg:py-24`}>
          <div className="flex flex-col justify-between gap-12">
            <div>
              <SplitHeading lines={['Ready to fix your supply chain?']} className="display-lg max-w-[13ch]" />
              <p data-rise className="micro mt-6 max-w-[46ch] text-white/75">
                Free for farmers. Buyers pay only on confirmed value. Create an account in a few minutes,
                then post your first demand or browse the open ones.
              </p>
            </div>
            <div data-rise className="flex flex-wrap gap-2.5">
              <Link to="/register" className="fm-btn fm-btn-light">Create an account</Link>
              <Link to="/login" className="fm-btn fm-btn-outline">Sign in</Link>
            </div>
          </div>

          <div className="relative min-h-[380px] sm:min-h-[520px]">
            {MOSAIC.map((t, i) => (
              <div key={i} data-parallax={t.drift} className={`absolute overflow-hidden rounded-[3px] ${t.box} ${t.tone ?? 'bg-forest-800'}`}>
                {t.photo && (
                  <img src={pexels(t.photo, 640)} srcSet={pexelsSrcSet(t.photo, [480, 640, 960])} sizes="(min-width: 1024px) 20vw, 40vw"
                    alt={t.alt} crossOrigin="anonymous" loading="lazy" decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-cream-100 text-forest-950">
        <div className={`${edge} grid gap-10 pt-16 sm:grid-cols-2 lg:grid-cols-12`}>
          <p className="micro max-w-[36ch] text-forest-900/70 lg:col-span-5">
            A produce marketplace connecting verified Nigerian farmers with the organisations that buy from them.
          </p>
          <div className="lg:col-span-2 lg:col-start-7">
            <p className="micro text-forest-900/45">Product</p>
            <ul className="mt-3 space-y-2 text-[15px]">
              {NAV_LINKS.slice(0, 3).map(l => <li key={l.href}><a href={l.href} className="hover:text-forest-600">{l.label}</a></li>)}
              <li><Link to="/login" className="hover:text-forest-600">Sign in</Link></li>
              <li><Link to="/register" className="hover:text-forest-600">Create account</Link></li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <p className="micro text-forest-900/45">Legal</p>
            <ul className="mt-3 space-y-2 text-[15px]">
              <li><Link to="/terms" className="hover:text-forest-600">Terms of service</Link></li>
              <li><Link to="/privacy" className="hover:text-forest-600">Privacy policy</Link></li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <p className="micro text-forest-900/45">Based in</p>
            <p className="mt-3 text-[15px]">Lagos, Nigeria</p>
          </div>
        </div>

        <div className={`${edge} mt-16 overflow-hidden`}>
          {/* Sized to fill the width between the gutters: the word is about 3.8x as wide as its font size */}
          <p aria-hidden="true" className="select-none whitespace-nowrap font-display text-[calc((100vw-40px)*0.258)] font-light leading-[0.78] tracking-[-0.06em] text-forest-900 md:text-[calc((100vw-64px)*0.258)] xl:text-[calc((100vw-80px)*0.258)]">
            FarmLink
          </p>
        </div>
        <div className={`${edge} micro flex flex-wrap justify-between gap-2 border-t border-forest-900/10 py-5 text-forest-900/50`}>
          <p>© {new Date().getFullYear()} FarmLink</p>
          <p>Fresh produce marketplace</p>
        </div>
      </footer>
    </div>
  );
}
