import { startTransition, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, Menu, X, ShoppingBag, LineChart, BookOpen, Truck,
  MessageSquare, Sparkles, Star, Hash, MessageCircle, Phone, Scale,
} from 'lucide-react';
import Logo from '../components/Logo';
import BackgroundVideo from '../components/BackgroundVideo';
import { VIDEOS } from '../lib/media';

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'For buyers',   href: '#for-buyers'   },
  { label: 'For farmers',  href: '#for-farmers'  },
  { label: 'Any phone',    href: '#any-phone'    },
];

const STEPS = {
  buyers: [
    { title: 'Post a demand',        sub: 'Describe the crop, quantity, quality grade, price and delivery window.' },
    { title: 'Review farmer offers', sub: 'Verified farmers commit supply. See where they farm and how they have delivered before.' },
    { title: 'Accept and track',     sub: 'Accept the offers that suit you and follow each delivery to your door.' },
  ],
  farmers: [
    { title: 'Browse demands', sub: 'See open orders from verified buyers. Filter by crop, price and delivery date.' },
    { title: 'Commit supply',  sub: 'Pledge the quantity you can deliver: all of it, or just part.' },
    { title: 'Deliver and get paid', sub: 'Mark each delivery as it happens and build a record buyers can trust.' },
  ],
};

const FEATURES = [
  { icon: LineChart,     title: 'Market prices',      sub: 'Reference prices per crop, set by FarmLink, so offers start from a fair number.' },
  { icon: MessageSquare, title: 'Messaging',          sub: 'Each order has its own conversation between the buyer and the farmer.' },
  { icon: Truck,         title: 'Delivery tracking',  sub: 'Orders move from accepted to in transit to delivered, then the buyer confirms receipt.' },
  { icon: Star,          title: 'Ratings and reviews', sub: 'Completed orders can be reviewed, so reputations come from real trades.' },
  { icon: Scale,         title: 'Dispute resolution', sub: 'Either side can report a problem with an order and an admin reviews it.' },
  { icon: Sparkles,      title: 'Farming assistant',  sub: 'Farmers can ask questions about crops, pests, diseases and soil.' },
];

const container = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Paint the hero first; the sections below the fold render right after in an interruptible pass
  const [showRest, setShowRest] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setTimeout(() => startTransition(() => setShowRest(true)), 0));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (showRest && window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView();
  }, [showRest]);

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

        <div className={`${container} pb-14 pt-28 sm:pb-20`}>
          <div className="max-w-2xl">
            <h1 className="text-[34px] font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Supply is complex.<br />FarmLink fixes it.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85 sm:text-xl">
              FarmLink connects verified farmers directly with hotels, restaurants, schools and NGOs.
              Buyers post what they need, farmers commit supply, and both sides see the same record
              from order to delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-lg bg-white text-gray-900 hover:bg-gray-100">
                Create an account
              </Link>
              <Link to="/login" className="btn-lg border border-white/50 text-white hover:bg-white/10">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {showRest ? (
        <>
          {/* ── How it works ── */}
          <section id="how-it-works" className="cv-auto scroll-mt-16 border-b border-gray-200 py-16 sm:py-24">
            <div className={container}>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
              <p className="mt-3 max-w-xl text-lg text-gray-600">
                Buyers and farmers each follow three steps. FarmLink keeps the record in between.
              </p>

              <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-16">
                {(['buyers', 'farmers'] as const).map(audience => (
                  <div key={audience}>
                    <h3 className="text-xl font-semibold">For {audience}</h3>
                    <ol className="mt-6 space-y-6">
                      {STEPS[audience].map((s, i) => (
                        <li key={s.title} className="flex gap-4">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-300 text-sm font-medium text-gray-700">
                            {i + 1}
                          </span>
                          <div className="pt-1">
                            <p className="text-lg font-medium text-gray-900">{s.title}</p>
                            <p className="mt-1 text-md leading-relaxed text-gray-600">{s.sub}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <Link to="/register" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 hover:text-forest-900">
                      {audience === 'buyers' ? 'Post your first demand' : 'Start selling'} <ArrowRight size={15} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── For buyers ── */}
          <section id="for-buyers" className="cv-auto scroll-mt-16 bg-cream-100 py-16 sm:py-24">
            <div className={`${container} grid items-center gap-10 lg:grid-cols-2 lg:gap-16`}>
              <div>
                <p className="text-sm font-medium text-forest-700">For hotels, restaurants, schools and NGOs</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Post once. Get committed supply.
                </h2>
                <p className="mt-4 text-lg text-gray-700">
                  Describe exactly what you need: crop, quantity, quality grade and delivery window.
                  Verified farmers commit to your specification. Review the offers, accept the best
                  ones, and track every delivery.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'No brokers or market agents in between',
                    'The price is visible on every demand',
                    'A record of every commitment and delivery',
                    'Recurring orders for regular kitchen needs',
                  ].map(t => (
                    <li key={t} className="flex items-start gap-3 text-md text-gray-800">
                      <Check size={18} className="mt-0.5 shrink-0 text-forest-700" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="btn-lg btn-primary mt-8">Post a demand</Link>
              </div>

              <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-xl bg-forest-900 lg:max-w-none">
                <BackgroundVideo video={VIDEOS.supply} label="Sacks of harvested maize ready for buyers" className="absolute inset-0 h-full w-full" />
              </div>
            </div>
          </section>

          {/* ── For farmers ── */}
          <section id="for-farmers" className="cv-auto scroll-mt-16 py-16 sm:py-24">
            <div className={`${container} grid items-center gap-10 lg:grid-cols-2 lg:gap-16`}>
              <div className="relative order-2 mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-xl bg-forest-900 lg:order-1 lg:max-w-none">
                <BackgroundVideo video={VIDEOS.farmer} label="A farmer checking his crops" className="absolute inset-0 h-full w-full" />
              </div>

              <div className="order-1 lg:order-2">
                <p className="text-sm font-medium text-forest-700">For farmers</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Sell what you grow, directly.</h2>
                <p className="mt-4 text-lg text-gray-700">
                  Browse open demands from verified buyers. Commit to supply what you already grow at
                  a clear price, and track every step from the field to payment.
                </p>
                <dl className="mt-8 grid gap-6 sm:grid-cols-2">
                  {[
                    { icon: ShoppingBag, title: 'Know your buyer',  sub: 'See who is buying before you harvest.' },
                    { icon: LineChart,   title: 'Clear prices',     sub: 'Every demand shows the price per kg.' },
                    { icon: BookOpen,    title: 'Crop guidance',    sub: 'Growing and storage tips for each crop.' },
                    { icon: Truck,       title: 'Delivery tracking', sub: 'Update each order as it moves.' },
                  ].map(b => (
                    <div key={b.title}>
                      <dt className="flex items-center gap-2 text-md font-medium text-gray-900">
                        <b.icon size={18} className="text-forest-700" /> {b.title}
                      </dt>
                      <dd className="mt-1 text-base text-gray-600">{b.sub}</dd>
                    </div>
                  ))}
                </dl>
                <Link to="/register" className="btn-lg btn-primary mt-8">Join as a farmer</Link>
              </div>
            </div>
          </section>

          {/* ── Any phone ── */}
          <section id="any-phone" className="cv-auto scroll-mt-16 bg-forest-900 py-16 text-white sm:py-24">
            <div className={`${container} grid items-center gap-10 lg:grid-cols-2 lg:gap-16`}>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">No smartphone needed.</h2>
                <p className="mt-4 max-w-lg text-lg text-white/80">
                  Farmers can browse demands, commit supply and check their orders by dialling a short
                  code or replying to an SMS. It works on any handset, without mobile data.
                </p>
                <dl className="mt-8 space-y-5">
                  {[
                    { icon: Hash,          code: '*384*1#',    text: 'Dial to browse demands that match your crops' },
                    { icon: MessageCircle, code: 'ACCEPT FL1', text: 'Reply to an alert to commit. Add a kg amount for part of the order.' },
                    { icon: Phone,         code: 'STATUS',     text: 'Check your orders from any phone' },
                  ].map(r => (
                    <div key={r.code} className="flex gap-4">
                      <r.icon size={18} className="mt-0.5 shrink-0 text-white/60" />
                      <div>
                        <dt className="font-mono text-sm font-semibold">{r.code}</dt>
                        <dd className="mt-0.5 text-base text-white/75">{r.text}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>

              <figure className="w-full max-w-sm justify-self-center lg:justify-self-end">
                <div className="rounded-lg border border-white/15 bg-black/30 p-5 font-mono text-sm leading-6 text-white/90">
                  <pre className="whitespace-pre-wrap">{`Welcome to FarmLink
Emeka Okafor
Ifo, Ogun State

1. Matching Demands
2. My Commitments
3. My Profile
0. Exit`}</pre>
                </div>
                <figcaption className="mt-3 text-xs text-white/60">The menu a farmer sees after dialling *384*1#</figcaption>
              </figure>
            </div>
          </section>

          {/* ── Features ── */}
          <section className="cv-auto py-16 sm:py-24">
            <div className={container}>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Also included</h2>
              <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map(f => (
                  <div key={f.title}>
                    <f.icon size={20} className="text-forest-700" />
                    <p className="mt-3 text-lg font-medium text-gray-900">{f.title}</p>
                    <p className="mt-1 text-md leading-relaxed text-gray-600">{f.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Call to action ── */}
          <section className="cv-auto border-t border-gray-200 bg-cream-100 py-16 sm:py-20">
            <div className={`${container} flex flex-col items-start justify-between gap-8 md:flex-row md:items-center`}>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ready to fix your supply chain?</h2>
                <p className="mt-2 text-lg text-gray-700">Free for farmers. Buyers pay only on confirmed value.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="btn-lg btn-primary">Create an account</Link>
                <Link to="/login" className="btn-lg btn-secondary">Sign in</Link>
              </div>
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="border-t border-gray-200 bg-white">
            <div className={`${container} grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4`}>
              <div className="lg:col-span-2">
                <Logo />
                <p className="mt-3 max-w-xs text-sm text-gray-600">
                  A produce marketplace connecting verified Nigerian farmers with the organisations that buy from them.
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Product</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  {NAV_LINKS.slice(0, 3).map(l => <li key={l.href}><a href={l.href} className="hover:text-gray-900">{l.label}</a></li>)}
                  <li><Link to="/login" className="hover:text-gray-900">Sign in</Link></li>
                  <li><Link to="/register" className="hover:text-gray-900">Create account</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Legal</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li><Link to="/terms" className="hover:text-gray-900">Terms of service</Link></li>
                  <li><Link to="/privacy" className="hover:text-gray-900">Privacy policy</Link></li>
                </ul>
              </div>
            </div>
            <div className={`${container} flex flex-wrap justify-between gap-2 border-t border-gray-200 py-6 text-xs text-gray-500`}>
              <p>© {new Date().getFullYear()} FarmLink</p>
              <p>Lagos, Nigeria</p>
            </div>
          </footer>
        </>
      ) : <div className="min-h-screen bg-white" />}
    </div>
  );
}
