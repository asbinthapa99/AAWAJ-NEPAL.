'use client';

import {
    type ReactNode,
    useState,
    useEffect,
    useRef,
} from 'react';
import { cn } from '@/lib/cn';

/* ── Dropdown ── */
interface DropdownProps {
    trigger: ReactNode;
    children: ReactNode;
    align?: 'left' | 'right';
    className?: string;
}

function Dropdown({ trigger, children, align = 'right', className }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <div onClick={() => setOpen(!open)}>{trigger}</div>
            {open && (
                <div
                    className={cn(
                        'absolute top-full mt-1 z-30 min-w-[180px]',
                        'bg-popover border border-border rounded-lg shadow-lg',
                        'animate-scale-in origin-top',
                        'py-1',
                        align === 'right' ? 'right-0' : 'left-0',
                        className,
                    )}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

/* ── DropdownItem ── */
interface DropdownItemProps {
    icon?: ReactNode;
    children: ReactNode;
    onClick?: () => void;
    destructive?: boolean;
    className?: string;
}

function DropdownItem({ icon, children, onClick, destructive, className }: DropdownItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors',
                destructive
                    ? 'text-destructive hover:bg-destructive/5'
                    : 'text-popover-foreground hover:bg-accent',
                className,
            )}
        >
            {icon}
            {children}
        </button>
    );
}

export { Dropdown, DropdownItem };
