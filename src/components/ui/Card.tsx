import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/* ── Card ── */
function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'rounded-xl border border-border bg-card text-card-foreground shadow-sm',
                className,
            )}
            {...props}
        />
    );
}

/* ── CardHeader ── */
function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex flex-col gap-1.5 p-5 pb-0', className)}
            {...props}
        />
    );
}

/* ── CardTitle ── */
function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn('text-lg font-semibold leading-none tracking-tight', className)}
            {...props}
        />
    );
}

/* ── CardDescription ── */
function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
}

/* ── CardContent ── */
function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn('p-5', className)} {...props} />
    );
}

/* ── CardFooter ── */
function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex items-center p-5 pt-0', className)}
            {...props}
        />
    );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
