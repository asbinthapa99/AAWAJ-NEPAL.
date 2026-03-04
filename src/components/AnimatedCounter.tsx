'use client';

import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
}

export function AnimatedCounter({ value, duration = 2000, suffix = '', prefix = '' }: AnimatedCounterProps) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const elementRef = useRef<HTMLSpanElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;

            // Easing function: easeOutExpo
            const easing = progress === duration ? 1 : 1 - Math.pow(2, -10 * progress / duration);

            const currentCount = Math.min(Math.round(easing * value), value);

            if (countRef.current !== currentCount) {
                setCount(currentCount);
                countRef.current = currentCount;
            }

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(value);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration, isVisible]);

    // Format number with commas
    const formattedCount = count.toLocaleString('en-US');

    // Convert to Nepali numerals if needed (simple mapping)
    // Assuming the user might view this in Nepali language
    // But standard comma-separated string is fine, the user's specific text includes commas, 
    // so we'll just format it normally and append/prepend.

    return (
        <span ref={elementRef} className="tabular-nums">
            {prefix}{formattedCount}{suffix}
        </span>
    );
}
