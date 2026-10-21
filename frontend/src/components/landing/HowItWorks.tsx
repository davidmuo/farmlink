import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Truck } from 'lucide-react';
import Avatar from '../Avatar';
import CropThumb from '../CropThumb';
import ReviewStars from '../ReviewStars';

type Audience = 'buyers' | 'farmers';

/* ─── Small pieces of the app, one per step ─────────────────── */

const Panel = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700">{children}</div>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="text-2xs text-gray-500">{label}</p>
    <div className="mt-1 flex h-7 items-center gap-1.5 rounded-md border border-gray-200 px-2 font-medium text-gray-900">{children}</div>
  </div>
);

function PostDemandVisual() {
  return (
    <Panel>
      <div className="space-y-2">
        <Field label="Crop"><CropThumb name="Tomatoes" size={16} rounded="full" /> Tomatoes</Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Quantity">500 kg</Field>
          <Field label="Price per kg">₦280</Field>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-gray-500">Grade A, deliver in 10 days</span>
        <span className="rounded-md bg-forest-800 px-2.5 py-1 font-medium text-white">Post demand</span>
      </div>
    </Panel>
  );
}

const OFFERS = [
  { name: 'Emeka Okafor', place: 'Ifo, Ogun',       kg: 200, accepted: true },
  { name: 'Kemi Alade',   place: 'Ikorodu, Lagos',  kg: 120, accepted: false },
  { name: 'Bayo Ogunleye', place: 'Ogbomoso, Oyo',  kg: 150, accepted: false },
];

function OffersVisual() {
  return (
    <Panel>
      <ul className="-my-1 divide-y divide-gray-100">
        {OFFERS.map(o => (
          <li key={o.name} className="flex items-center gap-2.5 py-2">
            <Avatar name={o.name} size={26} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{o.name}</p>
              <p className="truncate text-2xs text-gray-500">{o.place} · {o.kg} kg</p>
            </div>
            {o.accepted
              ? <span className="badge-green"><Check size={11} /> Accepted</span>
              : <span className="rounded-md border border-gray-300 px-2 py-0.5 font-medium text-gray-800">Accept</span>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

const TRACK = [
  { label: 'Accepted',   note: 'Mon, 10:14', state: 'done' },
  { label: 'In transit', note: 'Left Ifo at 07:30', state: 'now' },
  { label: 'Delivered',  note: '', state: 'next' },
  { label: 'Confirmed',  note: '', state: 'next' },
] as const;

function TrackVisual() {
  return (
    <Panel>
      <p className="font-medium text-gray-900">Tomatoes, 200 kg from Emeka Okafor</p>
      <ol className="mt-2.5 space-y-0">
        {TRACK.map((t, i) => (
          <li key={t.label} className="relative flex items-center gap-2.5 pb-2 last:pb-0">
            {i < TRACK.length - 1 && (
              <span className={`absolute left-[9px] top-5 h-[calc(100%-12px)] w-px ${t.state === 'done' ? 'bg-forest-400' : 'bg-gray-200'}`} />
            )}
            <span className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full ${
              t.state === 'done' ? 'bg-forest-100 text-forest-700' : t.state === 'now' ? 'bg-forest-800 text-white' : 'border border-gray-300 bg-white'
            }`}>
              {t.state === 'done' && <Check size={11} strokeWidth={3} />}
              {t.state === 'now' && <Truck size={10} />}
            </span>
            <span className={t.state === 'next' ? 'text-gray-400' : 'font-medium text-gray-900'}>{t.label}</span>
            {t.note && <span className="ml-auto text-2xs text-gray-500">{t.note}</span>}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

const OPEN_DEMANDS = [
  { crop: 'Peppers', kg: '200 kg',   buyer: 'Eko Hotels & Suites',        price: '₦600' },
  { crop: 'Maize',   kg: '2,000 kg', buyer: 'Lagos Food Bank Initiative', price: '₦280' },
  { crop: 'Yam',     kg: '600 kg',   buyer: 'Chrisland Schools Group',    price: '₦680' },
];

function BrowseVisual() {
  return (
    <Panel>
      <ul className="-my-1 divide-y divide-gray-100">
        {OPEN_DEMANDS.map(d => (
          <li key={d.crop} className="flex items-center gap-2.5 py-2">
            <CropThumb name={d.crop} size={28} rounded="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{d.crop}, {d.kg}</p>
              <p className="truncate text-2xs text-gray-500">{d.buyer}</p>
            </div>
            <span className="tabular font-semibold text-gray-900">{d.price}<span className="font-normal text-gray-500">/kg</span></span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function CommitVisual() {
  return (
    <Panel>
      <p className="font-medium text-gray-900">Peppers for Eko Hotels &amp; Suites</p>
      <div className="mt-2.5 grid grid-cols-2 rounded-md bg-gray-100 p-0.5 text-center font-medium">
        <span className="py-1 text-gray-500">Full, 200 kg</span>
        <span className="rounded bg-white py-1 text-gray-900 shadow-sm">Part of it</span>
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div className="flex-1"><Field label="You commit">120 kg</Field></div>
        <div className="pb-1 text-right">
          <p className="text-2xs text-gray-500">Value</p>
          <p className="tabular font-semibold text-gray-900">₦72,000</p>
        </div>
      </div>
      <span className="mt-3 flex h-7 items-center justify-center rounded-md bg-forest-800 font-medium text-white">Commit supply</span>
    </Panel>
  );
}

function DeliveredVisual() {
  return (
    <Panel>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100 text-forest-700"><Check size={16} strokeWidth={2.5} /></span>
        <div>
          <p className="font-medium text-gray-900">Delivery confirmed</p>
          <p className="text-2xs text-gray-500">Eko Hotels &amp; Suites received 120 kg</p>
        </div>
      </div>
      <div className="mt-3 rounded-md bg-gray-50 p-2.5">
        <ReviewStars rating={5} size={13} />
        <p className="mt-1.5 text-gray-700">“Firm, fresh peppers. Arrived on the morning we agreed.”</p>
      </div>
      <div className="mt-2.5 flex justify-between">
        <span className="text-gray-500">Order value</span>
        <span className="tabular font-semibold text-gray-900">₦72,000</span>
      </div>
    </Panel>
  );
}

/* ─── Section ───────────────────────────────────────────────── */

const STEPS: Record<Audience, { title: string; sub: string; visual: () => JSX.Element }[]> = {
  buyers: [
    { title: 'Post a demand',        sub: 'Describe the crop, quantity, quality grade, price and delivery window.', visual: PostDemandVisual },
    { title: 'Review farmer offers', sub: 'Verified farmers commit supply. See where they farm and how they have delivered before.', visual: OffersVisual },
    { title: 'Accept and track',     sub: 'Accept the offers that suit you and follow each delivery to your door.', visual: TrackVisual },
  ],
  farmers: [
    { title: 'Browse demands',       sub: 'See open orders from verified buyers. Filter by crop, price and delivery date.', visual: BrowseVisual },
    { title: 'Commit supply',        sub: 'Pledge the quantity you can deliver: all of it, or just part.', visual: CommitVisual },
    { title: 'Deliver and get paid', sub: 'Mark each delivery as it happens and build a record buyers can trust.', visual: DeliveredVisual },
  ],
};

export default function HowItWorks({ container }: { container: string }) {
  const [who, setWho] = useState<Audience>('buyers');

  return (
    <section id="how-it-works" className="cv-auto scroll-mt-16 py-20 sm:py-28">
      <div className={container}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-tight sm:text-[44px]">How it works</h2>
            <p className="mt-3 max-w-xl text-lg text-gray-600">
              Three steps on each side. FarmLink keeps one record in between, from the first order to the last delivery.
            </p>
          </div>

          <div role="tablist" aria-label="Show steps for" className="inline-flex self-start rounded-lg bg-gray-100 p-1 md:self-auto">
            {(['buyers', 'farmers'] as const).map(k => (
              <button key={k} role="tab" aria-selected={who === k} onClick={() => setWho(k)}
                className={`h-9 rounded-md px-4 text-sm font-medium transition-colors ${
                  who === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}>
                For {k}
              </button>
            ))}
          </div>
        </div>

        <ol key={who} className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS[who].map((s, i) => (
            <li key={s.title} className="flex animate-rise flex-col overflow-hidden rounded-xl border border-gray-200 bg-white"
              style={{ animationDelay: `${i * 90}ms` }}>
              <div className="p-6">
                <span className="tabular text-sm font-medium text-forest-700">0{i + 1}</span>
                <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-md leading-relaxed text-gray-600">{s.sub}</p>
              </div>
              <div className="mt-auto border-t border-gray-200 bg-gray-50 p-5"><s.visual /></div>
            </li>
          ))}
        </ol>

        <Link to="/register" className="mt-10 inline-flex items-center gap-1.5 text-md font-medium text-forest-700 hover:text-forest-900">
          {who === 'buyers' ? 'Post your first demand' : 'Start selling'} <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
