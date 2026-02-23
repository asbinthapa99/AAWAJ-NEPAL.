'use client';

import { categories } from '@/lib/categories';
import { PostCategory } from '@/lib/types';

interface CategoryFilterProps {
  selected: PostCategory | 'all';
  onChange: (category: PostCategory | 'all') => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onChange('all')}
        className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors ${
          selected === 'all'
            ? 'bg-[#e7f3ff] dark:bg-[#263951] text-[#1877F2]'
            : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] text-gray-700 dark:text-[#e4e6eb] hover:bg-[#e4e6eb] dark:hover:bg-[#4e4f50]'
        }`}
      >
        🔥 All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-1 ${
            selected === cat.id
              ? 'bg-[#e7f3ff] dark:bg-[#263951] text-[#1877F2]'
              : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] text-gray-700 dark:text-[#e4e6eb] hover:bg-[#e4e6eb] dark:hover:bg-[#4e4f50]'
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
