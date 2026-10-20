import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
}

export default function StatTile({ label, value, sub, icon: Icon }: Props) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-600">{label}</p>
        {Icon && <Icon size={16} className="shrink-0 text-gray-400" />}
      </div>
      <p className="tabular mt-2 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
