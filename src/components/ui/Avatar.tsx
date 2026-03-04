import { type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
    fallback?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-24 h-24 text-3xl',
};

function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps) {
    const initial = fallback?.[0]?.toUpperCase() || alt?.[0]?.toUpperCase() || 'U';

    if (src) {
        return (
            <img
                src={src}
                alt={alt || ''}
                className={cn(
                    'rounded-full object-cover flex-shrink-0',
                    sizeMap[size],
                    className,
                )}
                {...props}
            />
        );
    }

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center font-bold flex-shrink-0',
                'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground',
                sizeMap[size],
                className,
            )}
            aria-label={alt || fallback}
        >
            {initial}
        </div>
    );
}

export { Avatar };
