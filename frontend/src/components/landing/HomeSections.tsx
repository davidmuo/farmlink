import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BookOpen, Check, Hash, LineChart, MessageCircle, Phone, ShoppingBag, Truck } from 'lucide-react';
import Logo from '../Logo';
import BackgroundVideo from '../BackgroundVideo';
import CropTicker from './CropTicker';
import HowItWorks from './HowItWorks';
import UssdPhone from './UssdPhone';
import FeatureBento from './FeatureBento';
import { NAV_LINKS, container } from './shared';
import { PHOTOS, VIDEOS, pexels, pexelsSrcSet } from '../../lib/media';

const heading = 'text-[30px] font-semibold leading-[1.1] tracking-tight sm:text-[44px]';

// A notification laid over a section video, styled like the in-app toasts
function VideoNote({ icon: Icon, title, sub }: { icon: typeof Bell; title: string; sub: string }) {
  return (
    <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-xl bg-white p-3 shadow-float sm:inset-x-auto sm:left-5 sm:bottom-5 sm:w-[300px]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700"><Icon size={17} /></span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
        <p className="truncate text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  );
}

export default function HomeSections() {
  // Links like /#for-farmers land before these sections exist, so scroll once they do
  useEffect(() => {
    if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView();
  }, []);

  return (
    <>
      <CropTicker />

      <HowItWorks container={container} />

      {/* ── For buyers ── */}
      <section id="for-buyers" className="cv-auto scroll-mt-16 bg-forest-950 py-20 text-white sm:py-28">
        <div className={`${container} grid items-center gap-12 lg:grid-cols-2 lg:gap-16`}>
          <div>
            <p className="text-sm font-medium text-lime-300">For hotels, restaurants, schools and NGOs</p>
            <h2 className={`mt-3 ${heading}`}>Post once.<br />Get committed supply.</h2>
            <p className="mt-5 text-lg text-white/75">
              Describe exactly what you need: crop, quantity, quality grade and delivery window.
              Verified farmers commit to your specification. Review the offers, accept the best
              ones, and track every delivery.
            </p>
            <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {[
                'No brokers or market agents in between',
                'The price is visible on every demand',
                'A record of every commitment and delivery',
                'Recurring orders for regular kitchen needs',
              ].map(t => (
                <li key={t} className="flex items-start gap-3 text-md text-white/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400 text-forest-950">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/register" className="btn-lg mt-10 bg-white text-gray-900 hover:bg-gray-100">Post a demand</Link>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-xl bg-forest-900 lg:max-w-none">
            <BackgroundVideo video={VIDEOS.supply} label="Sacks of harvested maize ready for buyers" className="absolute inset-0 h-full w-full" />
            <VideoNote icon={Truck} title="Maize, 2,000 kg in transit" sub="To Lagos Food Bank Initiative, Ikeja" />
          </div>
        </div>
      </section>

      {/* ── For farmers ── */}
      <section id="for-farmers" className="cv-auto scroll-mt-16 py-20 sm:py-28">
        <div className={`${container} grid items-center gap-12 lg:grid-cols-2 lg:gap-16`}>
          <div className="relative order-2 mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-xl bg-forest-900 lg:order-1 lg:max-w-none">
            <BackgroundVideo video={VIDEOS.farmer} label="A farmer checking his crops" className="absolute inset-0 h-full w-full" />
            <VideoNote icon={Bell} title="New demand for your crops" sub="Peppers, 200 kg at ₦600/kg" />
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-sm font-medium text-forest-700">For farmers</p>
            <h2 className={`mt-3 ${heading}`}>Sell what you grow, directly.</h2>
            <p className="mt-5 text-lg text-gray-700">
              Browse open demands from verified buyers. Commit to supply what you already grow at
              a clear price, and track every step from the field to payment.
            </p>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: ShoppingBag, title: 'Know your buyer',   sub: 'See who is buying before you harvest.' },
                { icon: LineChart,   title: 'Clear prices',      sub: 'Every demand shows the price per kg.' },
                { icon: BookOpen,    title: 'Crop guidance',     sub: 'Growing and storage tips for each crop.' },
                { icon: Truck,       title: 'Delivery tracking', sub: 'Update each order as it moves.' },
              ].map(b => (
                <div key={b.title} className="rounded-xl border border-gray-200 p-4">
                  <dt className="flex items-center gap-2.5 text-md font-medium text-gray-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-50 text-forest-700"><b.icon size={16} /></span>
                    {b.title}
                  </dt>
                  <dd className="mt-2 text-base text-gray-600">{b.sub}</dd>
                </div>
              ))}
            </dl>
            <Link to="/register" className="btn-lg btn-primary mt-10">Join as a farmer</Link>
          </div>
        </div>
      </section>

      {/* ── Any phone ── */}
      <section id="any-phone" className="cv-auto scroll-mt-16 overflow-hidden bg-forest-900 py-20 text-white sm:py-28">
        <div className={`${container} grid items-center gap-14 lg:grid-cols-2 lg:gap-16`}>
          <div>
            <p className="text-sm font-medium text-lime-300">USSD and SMS</p>
            <h2 className={`mt-3 ${heading}`}>No smartphone needed.</h2>
            <p className="mt-5 max-w-lg text-lg text-white/75">
              Farmers can browse demands, commit supply and check their orders by dialling a short
              code or replying to an SMS. It works on any handset, without mobile data.
            </p>
            <dl className="mt-10 divide-y divide-white/10 border-y border-white/10">
              {[
                { icon: Hash,          code: '*384*1#',    text: 'Dial to browse demands that match your crops' },
                { icon: MessageCircle, code: 'ACCEPT FL1', text: 'Reply to an alert to commit. Add a kg amount for part of the order.' },
                { icon: Phone,         code: 'STATUS',     text: 'Check your orders from any phone' },
              ].map(r => (
                <div key={r.code} className="flex gap-4 py-4">
                  <r.icon size={18} className="mt-0.5 shrink-0 text-lime-300" />
                  <div>
                    <dt className="font-mono text-sm font-semibold">{r.code}</dt>
                    <dd className="mt-0.5 text-base text-white/70">{r.text}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <figure className="justify-self-center">
            <UssdPhone />
            <figcaption className="mt-4 text-center text-xs text-white/55">A FarmLink session on a basic handset</figcaption>
          </figure>
        </div>
      </section>

      <FeatureBento container={container} />

      {/* ── Call to action ── */}
      <section className="cv-auto relative isolate overflow-hidden bg-forest-950 py-24 text-white sm:py-32">
        <img src={pexels(PHOTOS.harvestBasket, 1600)} srcSet={pexelsSrcSet(PHOTOS.harvestBasket, [640, 960, 1280, 1920])} sizes="100vw"
          alt="" crossOrigin="anonymous" loading="lazy" decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_22%]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-950/95 via-forest-950/80 to-forest-950/40" />
        <div className={container}>
          <h2 className="max-w-2xl text-[34px] font-semibold leading-[1.05] tracking-tight sm:text-[56px]">
            Ready to fix your supply chain?
          </h2>
          <p className="mt-5 max-w-lg text-lg text-white/80">Free for farmers. Buyers pay only on confirmed value.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/register" className="btn-xl bg-white text-gray-900 hover:bg-gray-100">Create an account</Link>
            <Link to="/login" className="btn-xl border border-white/50 text-white hover:bg-white/10">Sign in</Link>
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
  );
}
