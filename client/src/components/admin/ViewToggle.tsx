'use client';

import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-surface rounded-lg border border-border">
      <button
        onClick={() => onChange('grid')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
          mode === 'grid'
            ? 'bg-primary text-background font-medium'
            : 'text-muted hover:text-white hover:bg-surfaceLight'
        }`}
        title="Візуальний режим"
      >
        <LayoutGrid size={18} />
        <span className="text-sm">GRID</span>
      </button>
      <button
        onClick={() => onChange('list')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
          mode === 'list'
            ? 'bg-primary text-background font-medium'
            : 'text-muted hover:text-white hover:bg-surfaceLight'
        }`}
        title="Табличний режим"
      >
        <List size={18} />
        <span className="text-sm">LIST</span>
      </button>
    </div>
  );
}
