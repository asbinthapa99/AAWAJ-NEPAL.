'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline:
        'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
    ghost:
        'hover:bg-accent hover:text-accent-foreground',
    destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
    md: 'h-10 px-4 text-sm gap-2 rounded-lg',
    lg: 'h-12 px-6 text-base gap-2.5 rounded-lg',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(
                    'inline-flex items-center justify-center font-semibold transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    'disabled:opacity-50 disabled:pointer-events-none',
                    'active:scale-[0.98]',
                    variantStyles[variant],
                    sizeStyles[size],
                    className,
                )}
                {...props}
            >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {children}
            </button>
        );
    },
);
Button.displayName = 'Button';

export { Button };
