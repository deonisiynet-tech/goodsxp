'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  // Calculate range of items shown
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first 3, current page area, and last 3
      if (currentPage <= 4) {
        // Near start: 1 2 3 4 5 ... 10
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end: 1 ... 6 7 8 9 10
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle: 1 ... 4 5 6 ... 10
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="mt-8 space-y-4">
      {/* Items info */}
      <div className="text-center text-sm text-muted">
        Показано {startItem}–{endItem} з {totalItems} товарів
      </div>

      {/* Pagination controls */}
      <div className="flex justify-center items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-surface border border-border text-muted hover:text-white hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Попередня сторінка"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="w-11 h-11 flex items-center justify-center text-muted"
              >
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`w-11 h-11 rounded-lg text-sm font-medium transition-all ${
                currentPage === page
                  ? 'bg-primary text-background shadow-lg shadow-primary/30'
                  : 'bg-surface border border-border text-muted hover:border-primary/50 hover:text-white'
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-surface border border-border text-muted hover:text-white hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Наступна сторінка"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
