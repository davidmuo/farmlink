import Avatar from '../Avatar';
import CropThumb from '../CropThumb';
import StatusBadge from '../StatusBadge';

// The seeded Eko Hotels tomato order, drawn the way buyers and farmers see a demand in the app
const deliverBy = new Date(Date.now() + 10 * 86_400_000).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });

export default function HeroDemand() {
  return (
    <div className="relative w-[360px]" aria-hidden="true">
      <div className="animate-rise rounded-xl bg-white p-5 text-gray-900 shadow-float" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-3">
          <CropThumb name="Tomatoes" size={44} rounded="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-md font-semibold">Tomatoes, Grade A</p>
            <p className="truncate text-xs text-gray-500">Eko Hotels &amp; Suites, Victoria Island</p>
          </div>
          <StatusBadge status="partially_filled" />
        </div>

        <dl className="mt-4 grid grid-cols-3 divide-x divide-gray-200 rounded-lg bg-gray-50 py-2.5 text-center">
          {[['Quantity', '500 kg'], ['Price', '₦280/kg'], ['Deliver by', deliverBy]].map(([k, v]) => (
            <div key={k}>
              <dt className="text-2xs text-gray-500">{k}</dt>
              <dd className="tabular mt-0.5 text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-gray-700">320 of 500 kg committed</span>
            <span className="tabular text-gray-500">64%</span>
          </div>
          <div className="progress-bar mt-1.5">
            <div className="h-full w-[64%] origin-left animate-grow-x rounded-full bg-forest-600" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center">
            <Avatar name="Emeka Okafor" size={26} ring />
            <Avatar name="Kemi Alade" size={26} ring className="-ml-2" />
            <span className="ml-2 text-xs text-gray-600">2 farmers committed</span>
          </div>
          <span className="text-xs font-medium text-forest-700">180 kg open</span>
        </div>
      </div>

      <div className="absolute -bottom-[50px] -left-14 flex w-[264px] animate-rise items-center gap-3 rounded-xl bg-white p-3 text-gray-900 shadow-float"
        style={{ animationDelay: '1100ms' }}>
        <Avatar name="Kemi Alade" size={34} />
        <div className="min-w-0">
          <p className="text-xs font-semibold">Kemi Alade committed 120 kg</p>
          <p className="text-2xs text-gray-500">Ikorodu, Lagos State · just now</p>
        </div>
      </div>
    </div>
  );
}
