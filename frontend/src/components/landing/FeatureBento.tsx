import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import Avatar from '../Avatar';
import CropThumb from '../CropThumb';
import DeliveryTrack from '../DeliveryTrack';
import ReviewStars from '../ReviewStars';

function Card({ title, sub, className = '', children }: { title: string; sub: string; className?: string; children: ReactNode }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`}>
      <div className="p-6 pb-0">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-md leading-relaxed text-gray-600">{sub}</p>
      </div>
      <div className="mt-auto p-6 pt-5 text-xs">{children}</div>
    </div>
  );
}

// Illustrative reference ranges, in line with the prices on the seeded demands
const PRICES = [
  { crop: 'Tomatoes', min: 250, max: 300 },
  { crop: 'Maize',    min: 260, max: 300 },
  { crop: 'Onions',   min: 320, max: 360 },
  { crop: 'Peppers',  min: 550, max: 650 },
  { crop: 'Yam',      min: 600, max: 700 },
];
const SCALE = 800;

function PriceRanges() {
  return (
    <ul className="space-y-2.5">
      {PRICES.map(p => (
        <li key={p.crop} className="flex items-center gap-3">
          <CropThumb name={p.crop} size={22} rounded="full" />
          <span className="w-16 shrink-0 font-medium text-gray-900">{p.crop}</span>
          {/* Pale up to the floor price, solid across the range */}
          <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <span className="absolute inset-y-0 left-0 rounded-full bg-forest-200" style={{ width: `${(p.max / SCALE) * 100}%` }} />
            <span className="absolute inset-y-0 rounded-full bg-forest-600"
              style={{ left: `${(p.min / SCALE) * 100}%`, width: `${((p.max - p.min) / SCALE) * 100}%` }} />
          </span>
          <span className="tabular w-[76px] shrink-0 text-right text-gray-600">₦{p.min}-{p.max}</span>
        </li>
      ))}
    </ul>
  );
}

function Conversation() {
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <Avatar name="Emeka Adeyemi" size={22} />
        <p className="max-w-[80%] rounded-lg rounded-bl-sm bg-gray-100 px-3 py-2 text-gray-800">Can you deliver Thursday instead of Friday?</p>
      </div>
      <div className="flex items-end justify-end gap-2">
        <p className="max-w-[80%] rounded-lg rounded-br-sm bg-forest-800 px-3 py-2 text-white">Yes. Thursday, 7am at the service gate.</p>
        <Avatar name="Emeka Okafor" size={22} />
      </div>
    </div>
  );
}

function Rating() {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <ReviewStars rating={5} size={13} />
      <p className="mt-2 text-gray-700">“Consistent grade and on time every week.”</p>
      <div className="mt-2.5 flex items-center gap-2">
        <Avatar name="Folake Adesanya" size={20} />
        <span className="text-gray-500">Chrisland Schools Group</span>
      </div>
    </div>
  );
}

function Delivery() {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <CropThumb name="Maize" size={28} rounded="lg" />
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">Maize, 2,000 kg</p>
          <p className="truncate text-2xs text-gray-500">To Lagos Food Bank Initiative, Ikeja</p>
        </div>
      </div>
      {/* The track is wider than a phone column, so it scrolls sideways there */}
      <div className="scrollbar-hide -mx-6 mt-4 overflow-x-auto px-6">
        <DeliveryTrack status="in_transit" />
      </div>
    </div>
  );
}

function Dispute() {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-gray-900">Short delivery</p>
        <span className="badge-amber">Under review</span>
      </div>
      <p className="mt-1 text-gray-600">Ordered 300 kg of onions, received 280 kg.</p>
    </div>
  );
}

function Assistant() {
  return (
    <div className="space-y-2">
      <p className="ml-auto w-fit max-w-[85%] rounded-lg rounded-br-sm bg-gray-100 px-3 py-2 text-gray-800">When should I harvest cassava?</p>
      <div className="flex gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-800 text-white"><Sparkles size={12} /></span>
        <p className="text-gray-700">Most varieties are ready 9 to 12 months after planting. Lift one plant first and check the root size.</p>
      </div>
    </div>
  );
}

export default function FeatureBento({ container }: { container: string }) {
  return (
    <section className="cv-auto bg-cream-100 py-20 sm:py-28">
      <div className={container}>
        <h2 className="text-[30px] font-semibold leading-[1.1] tracking-tight sm:text-[44px]">Everything an order needs</h2>
        <p className="mt-3 max-w-xl text-lg text-gray-600">From the first price to the final review, it all happens in one place.</p>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="md:col-span-2" title="Market prices" sub="Reference prices per crop, set by FarmLink, so offers start from a fair number.">
            <PriceRanges />
          </Card>
          <Card title="Messaging" sub="Each order has its own conversation.">
            <Conversation />
          </Card>
          <Card title="Ratings and reviews" sub="Reputations come from real trades.">
            <Rating />
          </Card>
          <Card className="md:col-span-2" title="Delivery tracking" sub="Orders move from accepted to in transit to delivered, then the buyer confirms receipt.">
            <Delivery />
          </Card>
          <Card title="Dispute resolution" sub="Either side can report a problem and an admin reviews it.">
            <Dispute />
          </Card>
          <Card title="Farming assistant" sub="Answers on crops, pests, diseases and soil.">
            <Assistant />
          </Card>
        </div>
      </div>
    </section>
  );
}
