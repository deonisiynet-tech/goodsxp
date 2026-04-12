'use client';

import { useState, useEffect, useRef } from 'react';
import { formatDescription } from '@/lib/format-description';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DescriptionRendererProps {
  description: string | null;
  collapseAfterLines?: number;
}

export default function DescriptionRenderer({
  description,
  collapseAfterLines = 8,
}: DescriptionRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && !isExpanded) {
      // Measure if content exceeds collapse threshold
      const lineHeight = parseFloat(getComputedStyle(contentRef.current).lineHeight) || 24;
      const collapseHeight = lineHeight * collapseAfterLines;
      setNeedsCollapse(contentRef.current.scrollHeight > collapseHeight);
    }
  }, [description, collapseAfterLines, isExpanded]);

  if (!description) return null;

  const html = formatDescription(description);

  return (
    <div className="max-w-full">
      <div
        ref={contentRef}
        className="text-[#9ca3af] leading-relaxed description-content"
        style={
          !isExpanded && needsCollapse
            ? {
                maxHeight: `${24 * collapseAfterLines}px`,
                overflow: 'hidden',
                position: 'relative',
              }
            : {}
        }
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Fade gradient overlay when collapsed */}
      {!isExpanded && needsCollapse && (
        <div className="relative">
          <div
            className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#18181c] to-transparent pointer-events-none"
            style={{ bottom: '-40px' }}
          />
        </div>
      )}

      {/* Show More / Show Less button */}
      {needsCollapse && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={16} />
              Сховати
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Показати ще
            </>
          )}
        </button>
      )}
    </div>
  );
}
