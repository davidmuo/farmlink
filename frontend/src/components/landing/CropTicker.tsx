import { useEffect, useState } from 'react';
import CropThumb from '../CropThumb';
import api from '../../lib/api';

// The crop catalogue buyers and farmers trade in
const CROPS: [name: string, category: string][] = [
  ['Tomatoes', 'Vegetables'], ['Maize', 'Grains'], ['Peppers', 'Vegetables'], ['Onions', 'Vegetables'],
  ['Cabbage', 'Vegetables'], ['Yam', 'Root vegetables'], ['Cassava', 'Root vegetables'], ['Plantain', 'Fruits'],
  ['Okra', 'Vegetables'], ['Watermelon', 'Fruits'], ['Cucumber', 'Vegetables'], ['Cowpea', 'Legumes'],
];

interface MarketPrice { priceMin: number; priceMax: number; unit?: string | null; crop: { cropName: string } }

export default function CropTicker() {
  // Reference prices replace the category once an admin has set them
  const [prices, setPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get<MarketPrice[]>('/market-prices')
      .then(({ data }) => {
        const byCrop: Record<string, string> = {};
        data.forEach(p => {
          byCrop[p.crop.cropName] = `₦${p.priceMin.toLocaleString()}-${p.priceMax.toLocaleString()}/${p.unit || 'kg'}`;
        });
        setPrices(byCrop);
      })
      .catch(() => {});
  }, []);

  const row = (copy: number) => CROPS.map(([name, category]) => (
    <li key={`${copy}-${name}`} aria-hidden={copy > 0 || undefined} className="flex shrink-0 items-center gap-3 pr-10">
      <CropThumb name={name} size={30} rounded="full" />
      <span className="text-sm font-medium text-white">{name}</span>
      <span className="tabular text-sm text-white/55">{prices[name] ?? category}</span>
    </li>
  ));

  return (
    <section aria-label="Crops traded on FarmLink" className="border-t border-white/10 bg-forest-950">
      <div className="flex items-center">
        <p className="hidden shrink-0 border-r border-white/10 px-8 py-5 text-sm font-medium text-white lg:block">
          12 crops, one marketplace
        </p>
        <div className="min-w-0 flex-1 overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]">
          {/* Two identical rows slide left by half their width, so the loop has no seam */}
          <ul className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            {row(0)}
            {row(1)}
          </ul>
        </div>
      </div>
    </section>
  );
}
