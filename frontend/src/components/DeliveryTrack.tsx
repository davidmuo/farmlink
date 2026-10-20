import { Truck } from 'lucide-react';

export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'completed';

const STEPS: { key: DeliveryStatus; label: string }[] = [
  { key: 'pending',    label: 'Awaiting dispatch' },
  { key: 'in_transit', label: 'In transit' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'completed',  label: 'Confirmed' },
];

export default function DeliveryTrack({ status }: { status: DeliveryStatus }) {
  const idx = Math.max(0, STEPS.findIndex(s => s.key === status));
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1.5">
          <span className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-semibold ${
            i < idx ? 'bg-forest-50 text-forest-700' : i === idx ? 'bg-forest-800 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {s.key === 'in_transit' && i === idx && <Truck size={11} />}
            {s.label}
          </span>
          {i < STEPS.length - 1 && <span className={`h-px w-3 ${i < idx ? 'bg-forest-400' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );
}
