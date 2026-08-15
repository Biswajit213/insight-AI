import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import type { AIInsightDataPoint } from '../../types';

interface InsightMiniChartProps {
  data?: AIInsightDataPoint[];
  kind?: 'line' | 'bar' | 'scatter' | 'area' | 'comparison';
  height?: number;
}

const DEFAULT_DATA: AIInsightDataPoint[] = [
  { x: 'Jan', y: 42 },
  { x: 'Feb', y: 55 },
  { x: 'Mar', y: 48 },
  { x: 'Apr', y: 70 },
  { x: 'May', y: 62 },
  { x: 'Jun', y: 88 },
];

export const InsightMiniChart: React.FC<InsightMiniChartProps> = ({
  data = DEFAULT_DATA,
  kind = 'line',
  height = 110,
}) => {
  const chartData = data && data.length > 0 ? data : DEFAULT_DATA;

  if (kind === 'bar' || kind === 'comparison') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
          <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
          />
          <Bar dataKey="y" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={24}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.x === 'Before Cleanup' ? '#64748b' : entry.x === 'After Cleanup' ? '#10b981' : '#3b82f6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (kind === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
          <XAxis dataKey="x" type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis dataKey="y" type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
          />
          <Scatter data={chartData} fill="#8b5cf6" />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (kind === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="mini_area_g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
          />
          <Area type="monotone" dataKey="y" stroke="#ef4444" strokeWidth={2} fill="url(#mini_area_g)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Default Line chart (Trend / Forecast)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
        <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
        />
        <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} />
      </LineChart>
    </ResponsiveContainer>
  );
};
