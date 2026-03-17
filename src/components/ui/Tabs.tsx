'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Tab {
    id: string;
    label: string;
    icon?: ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
    return (
        <div
            role="tablist"
            className={cn(
                'flex gap-1 p-1 rounded-lg bg-muted overflow-x-auto scrollbar-hide',
                className,
            )}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-150',
                        activeTab === tab.id
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-card/50',
                    )}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

export { Tabs, type Tab };
