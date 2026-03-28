import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'green' | 'blue' | 'amber' | 'purple' | 'gray' | 'red';
  trend?: number;   // percentage, positive = up, negative = down
  sub?: string;
}

const palette = {
  green:  { icon: 'bg-emerald-50 text-emerald-600',   val: 'text-gray-900' },
  blue:   { icon: 'bg-blue-50 text-blue-600',         val: 'text-gray-900' },
  amber:  { icon: 'bg-amber-50 text-amber-600',       val: 'text-gray-900' },
  purple: { icon: 'bg-purple-50 text-purple-600',     val: 'text-gray-900' },
  gray:   { icon: 'bg-gray-100 text-gray-500',        val: 'text-gray-900' },
  red:    { icon: 'bg-red-50 text-red-600',           val: 'text-gray-900' },
};

export default function StatCard({ label, value, icon: Icon, color = 'gray', trend, sub }: Props) {
  const p = palette[color];
  return (
    <div className="card-p flex flex-col gap-3 hover:shadow-card-hover transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl ${p.icon} flex items-center justify-center`}>
          <Icon size={17} strokeWidth={2} />
        </div>
        {trend !== undefined && (
          trend >= 0
            ? <span className="trend-up"><TrendingUp size={11} />{trend}%</span>
            : <span className="trend-down"><TrendingDown size={11} />{Math.abs(trend)}%</span>
        )}
      </div>
      <div>
        <p className={`text-2xl font-bold tracking-tight ${p.val}`}>{value}</p>
        <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-300 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
