'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, id, ...props }, ref) => {
        const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-medium text-foreground mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={cn(
                        'w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground',
                        'placeholder:text-muted-foreground',
                        'transition-colors duration-150 resize-none',
                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background focus:border-primary',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        error && 'border-destructive focus:ring-destructive',
                        className,
                    )}
                    {...props}
                />
                {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            </div>
        );
    },
);
Textarea.displayName = 'Textarea';

export { Textarea };
