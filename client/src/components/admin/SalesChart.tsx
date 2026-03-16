'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface DailyRevenue {
  date: string;
  revenue: number;
}

interface SalesChartProps {
  data?: DailyRevenue[];
  loading?: boolean;
  days?: number;
}

export default function SalesChart({ data = [], loading = false, days = 7 }: SalesChartProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Графік продажів</h2>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'numeric' });
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('uk-UA')} ₴`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surfaceLight border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted mb-1">{label}</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Prepare chart data - reverse to show oldest to newest
  const chartData = Array.isArray(data) ? [...data].reverse() : [];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Графік продажів</h2>
          <p className="text-sm text-muted mt-1">Дохід за останні {days} днів</p>
        </div>
        <div className="flex items-center gap-2 text-green-400">
          <TrendingUp size={20} />
          <span className="text-sm font-medium">
            {chartData.length > 0 
              ? formatCurrency(chartData.reduce((sum, d) => sum + d.revenue, 0))
              : '0 ₴'
            }
          </span>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}₴`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#60A5FA' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted">
          <div className="text-center">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
            <p>Немає даних про продажі</p>
          </div>
        </div>
      )}
    </div>
  );
}
