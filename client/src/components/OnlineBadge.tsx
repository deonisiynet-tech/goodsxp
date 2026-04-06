'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

/**
 * Показує кількість відвідувачів онлайн — соціальне доказательство
 */
export default function OnlineBadge() {
  const [online, setOnline] = useState<number | null>(null);

  useEffect(() => {
    const fetchOnline = async () => {
      try {
        const res = await fetch('/api/analytics/online');
        const data = await res.json();
        setOnline(Math.max(data.count || 0, 1)); // Minimum 1 to avoid 0
      } catch {
        setOnline(null);
      }
    };

    fetchOnline();
    const interval = setInterval(fetchOnline, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (online === null || online === 0) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
      <Users size={14} />
      <span>Зараз на сайті: {online}</span>
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
    </div>
  );
}
