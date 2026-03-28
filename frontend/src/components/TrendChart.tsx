import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface Point { label: string; value: number; }

interface Props {
  data: Point[];
  color?: string;
  valuePrefix?: string;
  height?: number;
  showGrid?: boolean;
}

function CustomTooltip({ active, payload, label, valuePrefix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="font-bold text-gray-900">{valuePrefix}{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export default function TrendChart({
  data,
  color = '#6DFF8A',
  valuePrefix = '₦',
  height = 140,
  showGrid = false,
}: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center text-xs text-gray-300" style={{ height }}>
      No data yet
    </div>
  );

  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const pad = (max - min) * 0.15 || max * 0.1 || 1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.12} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        )}
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[min - pad, max + pad]}
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v))}
          orientation="right"
        />
        <Tooltip
          content={<CustomTooltip valuePrefix={valuePrefix} />}
          cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace('#', '')})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
