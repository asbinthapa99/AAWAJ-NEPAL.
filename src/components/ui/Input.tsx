'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    help?: string;
    icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, help, icon, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-foreground mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            'w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground',
                            'placeholder:text-muted-foreground',
                            'transition-colors duration-150',
                            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background focus:border-primary',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            icon && 'pl-10',
                            error && 'border-destructive focus:ring-destructive',
                            className,
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
                {help && !error && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
            </div>
        );
    },
);
Input.displayName = 'Input';

export { Input };
