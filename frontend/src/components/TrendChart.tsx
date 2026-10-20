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
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-md">
      <p className="mb-0.5 text-gray-500">{label}</p>
      <p className="tabular font-semibold">{valuePrefix}{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export default function TrendChart({
  data,
  color = '#275C41',
  valuePrefix = '₦',
  height = 140,
  showGrid = false,
}: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center text-xs text-gray-400" style={{ height }}>
      No data yet
    </div>
  );

  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const pad = (max - min) * 0.15 || max * 0.1 || 1;
  const gradId = `grad-${color.replace('#', '')}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.14} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 4" stroke="#E2E5DE" vertical={false} />
        )}
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#9AA195' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          domain={[min >= 0 ? Math.max(0, min - pad) : min - pad, max + pad]}
          tick={{ fontSize: 10, fill: '#9AA195' }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v))}
          orientation="right"
        />
        <Tooltip
          content={<CustomTooltip valuePrefix={valuePrefix} />}
          cursor={{ stroke: '#CDD2C8', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.25}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 4.5, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
