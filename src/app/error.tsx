'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
                Something went wrong!
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md">
                We encountered an unexpected error. Our team has been notified.
                Please try refreshing the page.
            </p>

            <div className="flex gap-4">
                <Button onClick={() => window.location.reload()} variant="primary" size="lg" className="min-w-[140px]">
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Refresh Page
                </Button>
                <Button onClick={() => reset()} variant="outline" size="lg" className="min-w-[140px]">
                    Try Again
                </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
                <div className="max-w-xl text-left mt-10 p-4 border border-border bg-card rounded-xl overflow-auto text-xs font-mono text-muted-foreground">
                    <p className="font-bold text-destructive mb-2">{error.message}</p>
                    <pre>{error.stack}</pre>
                </div>
            )}
        </div>
    );
}
