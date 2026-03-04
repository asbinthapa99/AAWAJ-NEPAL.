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
        className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors ${selected === 'all'
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-foreground hover:bg-accent'
          }`}
      >
        🔥 All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`flex-shrink-0 px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-1 ${selected === cat.id
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-foreground hover:bg-accent'
            }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
