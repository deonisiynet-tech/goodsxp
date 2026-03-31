'use client';

import { useState, useEffect } from 'react';
import { Users, Activity } from 'lucide-react';

interface VisitorStatsProps {
  period?: 'today' | '3days' | '7days' | '30days';
}

export default function VisitorStats({ period = '7days' }: VisitorStatsProps) {
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '3days' | '7days' | '30days'>(period);
  const [loading, setLoading] = useState(true);

  // Період в днях для API
  const daysMap = {
    today: 1,
    '3days': 3,
    '7days': 7,
    '30days': 30,
  };

  const loadStats = async () => {
    try {
      // ✅ Завантажуємо онлайн
      const onlineRes = await fetch('/api/analytics/online', {
        cache: 'no-store',
      });
      if (onlineRes.ok) {
        const onlineData = await onlineRes.json();
        setOnlineCount(onlineData.count || 0);
      }

      // ✅ Завантажуємо відвідувачів за період
      const days = daysMap[selectedPeriod];
      const visitorsRes = await fetch(`/api/analytics/visitors?days=${days}`, {
        cache: 'no-store',
      });
      if (visitorsRes.ok) {
        const visitorsData = await visitorsRes.json();
        setVisitorCount(visitorsData.count || 0);
      }
    } catch (error) {
      console.error('[VisitorStats] Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    
    // ✅ Оновлення кожні 15 секунд
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const periodLabels = {
    today: 'Сьогодні',
    '3days': '3 дні',
    '7days': '7 днів',
    '30days': '30 днів',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ✅ Онлайн зараз */}
      <div className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted mb-1">Онлайн зараз</p>
            {loading ? (
              <div className="h-10 w-24 bg-surface rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-white">
                {onlineCount} {onlineCount === 1 ? 'користувач' : onlineCount < 5 ? 'користувачі' : 'користувачів'}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">Оновлення кожні 15с</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl border bg-green-500/10 border-green-500/30 text-green-400">
            <Activity size={28} />
          </div>
        </div>
      </div>

      {/* ✅ Відвідувачі сайту */}
      <div className="card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted mb-1">Відвідувачі сайту</p>
            {loading ? (
              <div className="h-10 w-24 bg-surface rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold text-white">
                {visitorCount} {visitorCount === 1 ? 'відвідувач' : visitorCount < 5 ? 'відвідувачі' : 'відвідувачів'}
              </p>
            )}
            {/* Перемикач періоду */}
            <div className="flex gap-2 mt-3">
              {(Object.keys(periodLabels) as Array<keyof typeof periodLabels>).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`text-xs px-3 py-1 rounded-lg transition-all duration-200 ${
                    selectedPeriod === p
                      ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                      : 'bg-surface border border-border text-muted hover:border-purple-500/30'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-2xl border bg-purple-500/10 border-purple-500/30 text-purple-400">
            <Users size={28} />
          </div>
        </div>
      </div>
    </div>
  );
}
