'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface DailyRevenue {
  date: string;
  revenue: number;
}

interface DailyProfit {
  date: string;
  profit: number;
}

interface SalesChartProps {
  data?: DailyRevenue[];
  profitData?: DailyProfit[];
  loading?: boolean;
  days?: number;
}

export default function SalesChart({ data = [], profitData = [], loading = false, days = 30 }: SalesChartProps) {
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
    const numValue = typeof value === 'bigint' ? Number(value) : Number(value) || 0;
    return `${numValue.toLocaleString('uk-UA')} ₴`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surfaceLight border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-lg font-bold" style={{ color: entry.color }}>
              {entry.name === 'Прибуток' ? 'Прибуток' : 'Оборот'}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare chart data - reverse to show oldest to newest
  const revenueChartData = Array.isArray(data) ? data.map(d => ({
    ...d,
    revenue: typeof d.revenue === 'bigint' ? Number(d.revenue) : Number(d.revenue) || 0,
  })).reverse() : [];

  const profitChartData = Array.isArray(profitData) ? profitData.map(d => ({
    ...d,
    profit: typeof d.profit === 'bigint' ? Number(d.profit) : Number(d.profit) || 0,
  })).reverse() : [];

  // Merge by date
  const allDates = new Set([
    ...revenueChartData.map(d => d.date),
    ...profitChartData.map(d => d.date),
  ]);

  const chartData = Array.from(allDates).map(date => {
    const revenueEntry = revenueChartData.find(d => d.date === date);
    const profitEntry = profitChartData.find(d => d.date === date);
    return {
      date,
      revenue: revenueEntry?.revenue || 0,
      profit: profitEntry?.profit || 0,
    };
  });

  const totalProfit = profitChartData.reduce((sum, d) => sum + d.profit, 0);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Графік прибутку</h2>
          <p className="text-sm text-muted mt-1">Прибуток за останні {days} днів</p>
        </div>
        <div className="flex items-center gap-2 text-green-400">
          <TrendingUp size={20} />
          <span className="text-sm font-medium">
            {chartData.length > 0
              ? formatCurrency(totalProfit)
              : '0 ₴'
            }
          </span>
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
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
              dataKey="profit"
              name="Прибуток"
              stroke="#22C55E"
              strokeWidth={2}
              dot={{ fill: '#22C55E', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#4ADE80' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted">
          <div className="text-center">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
            <p>Немає даних про прибуток</p>
          </div>
        </div>
      )}
    </div>
  );
}
