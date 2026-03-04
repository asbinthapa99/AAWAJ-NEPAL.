'use client';

import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    icon?: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, icon, id, children, ...props }, ref) => {
        const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-foreground mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <select
                        ref={ref}
                        id={selectId}
                        className={cn(
                            'w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground',
                            'appearance-none',
                            'transition-colors duration-150',
                            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background focus:border-primary',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            icon && 'pl-10',
                            error && 'border-destructive focus:ring-destructive',
                            className,
                        )}
                        {...props}
                    >
                        {children}
                    </select>
                    {/* Chevron */}
                    <svg
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
                {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            </div>
        );
    },
);
Select.displayName = 'Select';

export { Select };
