import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: AlertVariant;
    title?: string;
}

const config: Record<AlertVariant, { icon: typeof Info; styles: string }> = {
    info: {
        icon: Info,
        styles: 'bg-primary/5 border-primary/20 text-primary [&>svg]:text-primary',
    },
    success: {
        icon: CheckCircle,
        styles: 'bg-success/5 border-success/20 text-success [&>svg]:text-success',
    },
    warning: {
        icon: AlertTriangle,
        styles: 'bg-warning/5 border-warning/20 text-warning [&>svg]:text-warning',
    },
    error: {
        icon: XCircle,
        styles: 'bg-destructive/5 border-destructive/20 text-destructive [&>svg]:text-destructive',
    },
};

function Alert({ className, variant = 'info', title, children, ...props }: AlertProps) {
    const { icon: Icon, styles } = config[variant];

    return (
        <div
            role="alert"
            className={cn(
                'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
                styles,
                className,
            )}
            {...props}
        >
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
                {title && <p className="font-semibold mb-0.5">{title}</p>}
                <div className="opacity-90">{children}</div>
            </div>
        </div>
    );
}

export { Alert };
