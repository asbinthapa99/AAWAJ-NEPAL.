'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Megaphone } from 'lucide-react';
import { cn } from '@/lib/cn';

export type PostingStatus = 'idle' | 'posting' | 'success' | 'error';

interface PostingToastProps {
  status: PostingStatus;
  errorMessage?: string;
  /** Called after the success toast auto-dismisses */
  onDismiss?: () => void;
}

const STAGES = [
  'Uploading media…',
  'Saving your post…',
  'Notifying followers…',
  'Almost done…',
];

export default function PostingToast({ status, errorMessage, onDismiss }: PostingToastProps) {
  const [visible, setVisible] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Show/hide based on status
  useEffect(() => {
    if (status === 'idle') {
      setVisible(false);
      setStageIndex(0);
      setProgress(0);
      return;
    }
    setVisible(true);
  }, [status]);

  // Cycle through progress stages while posting
  useEffect(() => {
    if (status !== 'posting') return;
    setProgress(0);
    setStageIndex(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) { clearInterval(progressInterval); return 85; }
        return p + Math.random() * 12;
      });
    }, 400);

    const stageInterval = setInterval(() => {
      setStageIndex((i) => (i < STAGES.length - 1 ? i + 1 : i));
    }, 900);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
    };
  }, [status]);

  // Jump to 100% and auto-dismiss on success
  useEffect(() => {
    if (status !== 'success') return;
    setProgress(100);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 2200);
    return () => clearTimeout(timer);
  }, [status, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-end sm:items-start justify-center sm:justify-end p-4 sm:p-6">
      <div
        className={cn(
          'pointer-events-auto w-full max-w-sm rounded-2xl shadow-2xl border backdrop-blur-md',
          'transition-all duration-300',
          status === 'posting' && 'bg-card/95 border-border',
          status === 'success' && 'bg-emerald-950/95 border-emerald-700/50',
          status === 'error'   && 'bg-rose-950/95 border-rose-700/50',
          visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95',
        )}
        style={{ animation: visible ? 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' : undefined }}
      >
        {/* Progress bar — only visible while posting or on success */}
        {(status === 'posting' || status === 'success') && (
          <div className="h-1 w-full bg-white/10 rounded-t-2xl overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                status === 'success' ? 'bg-emerald-400 duration-500' : 'bg-primary duration-300',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="p-4 flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
            status === 'posting' && 'bg-primary/15',
            status === 'success' && 'bg-emerald-500/20',
            status === 'error'   && 'bg-rose-500/20',
          )}>
            {status === 'posting' && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {status === 'error'   && <XCircle className="w-5 h-5 text-rose-400" />}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className={cn(
              'text-sm font-bold',
              status === 'posting' && 'text-foreground',
              status === 'success' && 'text-emerald-300',
              status === 'error'   && 'text-rose-300',
            )}>
              {status === 'posting' && 'Publishing your voice…'}
              {status === 'success' && '🎉 Voice published!'}
              {status === 'error'   && 'Post failed'}
            </p>
            <p className={cn(
              'text-xs mt-0.5 leading-relaxed',
              status === 'posting' && 'text-muted-foreground',
              status === 'success' && 'text-emerald-400/80',
              status === 'error'   && 'text-rose-400/80',
            )}>
              {status === 'posting' && STAGES[stageIndex]}
              {status === 'success' && 'Your post is now live for all to see'}
              {status === 'error'   && (errorMessage || 'Something went wrong. Please try again.')}
            </p>
          </div>

          {/* Megaphone badge on success */}
          {status === 'success' && (
            <div className="flex-shrink-0 text-2xl" style={{ animation: 'megaBounce 0.5s ease 0.2s both' }}>
              📢
            </div>
          )}
        </div>

        {/* Particle dots on success */}
        {status === 'success' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(8)].map((_, i) => (
              <span
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full opacity-0"
                style={{
                  background: ['#34d399','#60a5fa','#f472b6','#fbbf24','#a78bfa','#fb7185','#4ade80','#38bdf8'][i],
                  left: `${10 + i * 11}%`,
                  top: '50%',
                  animation: `confettiPop 0.6s ease ${i * 0.07}s forwards`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes megaBounce {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.3) rotate(8deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes confettiPop {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.3); }
        }
      `}</style>
    </div>
  );
}
