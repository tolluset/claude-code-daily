import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { DailyStats } from '@ccd/types';

interface TokenTrendChartProps {
  data: DailyStats[];
  height?: number;
}

export function TokenTrendChart({ data, height = 200 }: TokenTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value;
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px'
          }}
          labelFormatter={(value) => {
            const date = new Date(value);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          }}
          formatter={(value: number | undefined, name: string | undefined) => {
            if (value === undefined) return [0, name || ''];
            const formatted = value >= 1000000
              ? `${(value / 1000000).toFixed(1)}M`
              : value >= 1000
              ? `${(value / 1000).toFixed(0)}K`
              : value;
            return [formatted, name || ''];
          }}
        />
        <Line
          type="monotone"
          dataKey="total_output_tokens"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="Output Tokens"
        />
        <Line
          type="monotone"
          dataKey="total_input_tokens"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          name="Input Tokens"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
