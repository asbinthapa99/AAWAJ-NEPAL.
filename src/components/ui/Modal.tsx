'use client';

import { type HTMLAttributes, type ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    maxWidth?: string;
}

function Modal({
    open,
    onClose,
    title,
    description,
    children,
    maxWidth = 'max-w-lg',
    className,
    ...props
}: ModalProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center"
            onClick={(e) => {
                if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
                    onClose();
                }
            }}
        >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

            {/* Content */}
            <div
                ref={contentRef}
                role="dialog"
                aria-modal
                aria-label={title}
                className={cn(
                    'relative w-full bg-card border border-border rounded-xl shadow-xl animate-scale-in my-8',
                    maxWidth,
                    className,
                )}
                {...props}
            >
                {/* Header */}
                {(title || description) && (
                    <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-0">
                        <div>
                            {title && (
                                <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
                            )}
                            {description && (
                                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

export { Modal };
