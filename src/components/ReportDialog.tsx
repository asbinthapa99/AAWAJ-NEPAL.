'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';
import { Flag, X, Loader2 } from 'lucide-react';

interface ReportDialogProps {
  postId: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Spam or misleading',
  'Harassment or hate speech',
  'False information',
  'Violence or threats',
  'Not related to Nepal',
  'Inappropriate content',
  'Other',
];

export default function ReportDialog({ postId, onClose }: ReportDialogProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !user) return;

    setSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.from('reports').insert({
      post_id: postId,
      reporter_id: user.id,
      reason,
    });

    setSubmitting(false);

    if (error) {
      return;
    }

    setSubmitted(true);

    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800">
        {submitted ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Flag className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Report Submitted
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Thank you. Our team will review this post.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Report Post
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Why are you reporting this post?
            </p>

            <div className="space-y-2 mb-6">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                    reason === r
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 ring-2 ring-red-500/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Report
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
