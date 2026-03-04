import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> { }

function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-lg bg-muted',
                className,
            )}
            {...props}
        />
    );
}

export { Skeleton };
