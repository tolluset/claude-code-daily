import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ProjectData {
  name: string;
  value: number;
  percentage: number;
}

interface ProjectPieChartProps {
  data: ProjectData[];
  height?: number;
}

// Color palette for projects
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
];

export function ProjectPieChart({ data, height = 250 }: ProjectPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No project data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data as any}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }: any) => `${name} (${percentage.toFixed(0)}%)`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px'
          }}
          formatter={(value: number | undefined, _name: string | undefined, props: any) => {
            const percentage = props.payload.percentage;
            return [`${value || 0} sessions (${percentage.toFixed(1)}%)`, 'Sessions'];
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => {
            const item = data.find(d => d.name === value);
            return `${value}${item ? ` (${item.value})` : ''}`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
