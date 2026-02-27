'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Shield,
    Loader2,
    Trash2,
    Ban,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
} from 'lucide-react';

interface ReportItem {
    id: string;
    reporter_id: string;
    post_id: string;
    target_type: string;
    target_id: string;
    reason: string;
    details: string | null;
    status: string;
    created_at: string;
    reporter?: { full_name: string; username: string };
}

export default function AdminPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'reviewed' | 'dismissed' | 'all'>('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.replace('/dashboard');
        }
    }, [authLoading, user, isAdmin, router]);

    const fetchReports = useCallback(async () => {
        if (!user || !isAdmin) return;
        const supabase = createClient();

        let query = supabase
            .from('reports')
            .select('*, reporter:profiles!reports_reporter_id_fkey(full_name, username)')
            .order('created_at', { ascending: false });

        if (filter !== 'all') {
            query = query.eq('status', filter);
        }

        const { data } = await query.limit(50);

        const normalized = (data || []).map((r: Record<string, unknown>) => ({
            ...r,
            reporter: Array.isArray(r.reporter) ? r.reporter[0] : r.reporter,
        })) as ReportItem[];

        setReports(normalized);
        setLoading(false);
    }, [user, isAdmin, filter]);

    useEffect(() => {
        if (user && isAdmin) fetchReports();
    }, [user, isAdmin, fetchReports]);

    const updateReportStatus = async (reportId: string, status: string) => {
        setActionLoading(reportId);
        const supabase = createClient();
        await supabase.from('reports').update({ status }).eq('id', reportId);
        setReports((prev) =>
            prev.map((r) => (r.id === reportId ? { ...r, status } : r))
        );
        setActionLoading(null);
    };

    const removePost = async (postId: string, reportId: string) => {
        if (!confirm('Remove this post? It will be soft-deleted.')) return;
        setActionLoading(reportId);
        const supabase = createClient();
        await supabase
            .from('posts')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', postId);
        await updateReportStatus(reportId, 'reviewed');
        setActionLoading(null);
    };

    const banUser = async (userId: string, reportId: string) => {
        if (!confirm('Ban this user? They will no longer be able to log in.')) return;
        setActionLoading(reportId);
        const supabase = createClient();
        await supabase
            .from('profiles')
            .update({ banned_at: new Date().toISOString() })
            .eq('id', userId);
        await updateReportStatus(reportId, 'reviewed');
        setActionLoading(null);
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1877F2]" />
            </div>
        );
    }

    if (!isAdmin) return null;

    const statusFilters = [
        { id: 'pending' as const, label: 'Pending', icon: AlertTriangle },
        { id: 'reviewed' as const, label: 'Reviewed', icon: CheckCircle },
        { id: 'dismissed' as const, label: 'Dismissed', icon: XCircle },
        { id: 'all' as const, label: 'All', icon: Eye },
    ];

    return (
        <div className="min-h-[100dvh] bg-[#f0f2f5] dark:bg-[#18191a]">
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-gray-100 dark:border-[#393a3b] p-4 mb-5">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-6 h-6 text-[#1877F2]" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-[#e4e6eb]">
                            Admin — Moderation
                        </h1>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {statusFilters.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => { setFilter(f.id); setLoading(true); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === f.id
                                        ? 'bg-[#e7f3ff] dark:bg-[#263951] text-[#1877F2]'
                                        : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] text-gray-600 dark:text-[#b0b3b8] hover:bg-[#e4e6eb]'
                                    }`}
                            >
                                <f.icon className="w-4 h-4" />
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {reports.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-gray-100 dark:border-[#393a3b]">
                        <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-[#e4e6eb] mb-2">
                            No reports
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-[#b0b3b8]">
                            No {filter !== 'all' ? filter : ''} reports to show.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reports.map((report) => (
                            <div
                                key={report.id}
                                className="bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-gray-100 dark:border-[#393a3b] p-4"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${report.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                        : report.status === 'reviewed'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}
                                            >
                                                {report.status}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-[#b0b3b8]">
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-900 dark:text-[#e4e6eb] font-medium">
                                            Reason: {report.reason}
                                        </p>
                                        {report.details && (
                                            <p className="text-sm text-gray-600 dark:text-[#b0b3b8] mt-1">
                                                {report.details}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 dark:text-[#b0b3b8] mt-1">
                                            Reported by:{' '}
                                            <span className="font-medium">
                                                {report.reporter?.full_name || 'Unknown'} (@{report.reporter?.username || '?'})
                                            </span>
                                        </p>
                                        {report.post_id && (
                                            <Link
                                                href={`/post/${report.post_id}`}
                                                className="text-xs text-[#1877F2] hover:underline mt-1 inline-block"
                                            >
                                                View reported post →
                                            </Link>
                                        )}
                                    </div>

                                    {report.status === 'pending' && (
                                        <div className="flex flex-col gap-2 flex-shrink-0">
                                            {report.post_id && (
                                                <button
                                                    onClick={() => removePost(report.post_id, report.id)}
                                                    disabled={actionLoading === report.id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Remove Post
                                                </button>
                                            )}
                                            {report.target_type === 'user' && report.target_id && (
                                                <button
                                                    onClick={() => banUser(report.target_id, report.id)}
                                                    disabled={actionLoading === report.id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                                                >
                                                    <Ban className="w-3.5 h-3.5" />
                                                    Ban User
                                                </button>
                                            )}
                                            <button
                                                onClick={() => updateReportStatus(report.id, 'dismissed')}
                                                disabled={actionLoading === report.id}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-[#3a3b3c] text-gray-600 dark:text-[#b0b3b8] rounded-lg text-xs font-semibold hover:bg-gray-200 dark:hover:bg-[#4e4f50] transition-colors disabled:opacity-50"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                                Dismiss
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
