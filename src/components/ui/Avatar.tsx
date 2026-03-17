import Image from 'next/image';
import { cn } from '@/lib/cn';

interface AvatarProps {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeMap = {
    sm: { container: 'w-8 h-8 text-xs', image: 32 },
    md: { container: 'w-10 h-10 text-sm', image: 40 },
    lg: { container: 'w-14 h-14 text-lg', image: 56 },
    xl: { container: 'w-24 h-24 text-3xl', image: 96 },
};

function Avatar({ src, alt, fallback, size = 'md', className }: AvatarProps) {
    const initial = fallback?.[0]?.toUpperCase() || alt?.[0]?.toUpperCase() || 'U';
    const sizeConfig = sizeMap[size];

    if (src) {
        return (
            <div className={cn(
                'rounded-full overflow-hidden flex-shrink-0 relative',
                sizeConfig.container,
                className,
            )}>
                <Image
                    src={src}
                    alt={alt || ''}
                    fill
                    sizes="(max-width: 768px) 32px, 40px"
                    className="object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                'rounded-full flex items-center justify-center font-bold flex-shrink-0',
                'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground',
                sizeConfig.container,
                className,
            )}
            aria-label={alt || fallback}
        >
            {initial}
        </div>
    );
}

export { Avatar };
