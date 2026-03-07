/**
 * Content Moderation & Safety Service
 *
 * Features:
 *   - Report posts / users / comments
 *   - Flag content (spam, bot, inappropriate)
 *   - Simple client-side spam heuristics
 *   - Admin: review queue, take action, warnings, suspensions
 *   - Trust-score helpers
 */

import { supabase } from './supabase';

// ─── Types ─────────────────────────────────────────────────

export type ReportCategory =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'sexual'
  | 'misinformation'
  | 'impersonation'
  | 'copyright'
  | 'other';

export type ReportResolution =
  | 'dismissed'
  | 'warned'
  | 'content_removed'
  | 'user_suspended'
  | 'user_banned';

export type ModerationAction =
  | 'remove_content'
  | 'restore_content'
  | 'warn_user'
  | 'suspend_user'
  | 'unsuspend_user'
  | 'ban_user'
  | 'unban_user'
  | 'dismiss_report'
  | 'escalate_report'
  | 'flag_spam'
  | 'unflag_spam';

export type FlagType =
  | 'spam'
  | 'duplicate'
  | 'bot'
  | 'inappropriate'
  | 'low_quality'
  | 'auto_flagged';

export type FlagSeverity = 'low' | 'medium' | 'high' | 'critical';

export type WarningSeverity = 'notice' | 'warning' | 'strike' | 'final_warning';

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'user';
  target_id: string;
  category: ReportCategory;
  reason: string;
  details?: string;
  status: string;
  reviewed_by?: string;
  reviewed_at?: string;
  resolution?: ReportResolution;
  moderator_note?: string;
  created_at: string;
}

export interface ContentFlag {
  id: string;
  target_type: 'post' | 'comment';
  target_id: string;
  flag_type: FlagType;
  severity: FlagSeverity;
  source: 'system' | 'user' | 'admin';
  flagged_by?: string;
  resolved: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UserWarning {
  id: string;
  user_id: string;
  issued_by: string;
  reason: string;
  severity: WarningSeverity;
  related_id?: string;
  acknowledged_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface ModerationQueueItem {
  report_id: string;
  report_status: string;
  report_category: string;
  report_reason: string;
  report_details: string | null;
  reporter_name: string;
  target_type: string;
  target_id: string;
  report_count: number;
  created_at: string;
}

// ─── Spam Heuristics (client-side quick checks) ────────────

const SPAM_PATTERNS = [
  /(?:https?:\/\/){3,}/i,           // Many URLs
  /(.)\1{10,}/,                      // Repeated character 10+ times
  /(?:buy|sell|shop|click|visit|subscribe|free|prize|winner)\s/gi,
  /[\u0600-\u06FF]{20,}/,           // Long Arabic script (not Nepali)
  /(.{5,})\1{3,}/,                  // Exact phrase repeated 3+ times
];

const LINK_REGEX = /https?:\/\/[^\s]+/gi;

export function getSpamScore(text: string): number {
  let score = 0;

  // Pattern matches
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) score += 20;
  }

  // Excessive links
  const links = text.match(LINK_REGEX);
  if (links && links.length > 3) score += 15 * (links.length - 3);

  // ALL CAPS (> 70% of alphabetic chars)
  const alpha = text.replace(/[^a-zA-Z]/g, '');
  if (alpha.length > 20 && alpha === alpha.toUpperCase()) score += 15;

  // Very short content submitted repeatedly — caller can add extra signal
  if (text.length < 10) score += 5;

  return Math.min(score, 100);
}

/** Quick boolean check for likely spam */
export function isLikelySpam(text: string): boolean {
  return getSpamScore(text) >= 40;
}


// ─── User-facing: Report ───────────────────────────────────

/**
 * Submit a report against a post or user.
 */
export async function submitReport(params: {
  reporterId: string;
  targetType: 'post' | 'user';
  targetId: string;
  category: ReportCategory;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; error?: string }> {
  // De-dup: check if same reporter already reported this target
  const { count } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('reporter_id', params.reporterId)
    .eq('target_type', params.targetType)
    .eq('target_id', params.targetId)
    .in('status', ['pending', 'under_review']);

  if (count && count > 0) {
    return { success: false, error: 'You have already reported this item.' };
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: params.reporterId,
    target_type: params.targetType,
    target_id: params.targetId,
    category: params.category,
    reason: params.reason,
    details: params.details || null,
    status: 'pending',
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Flag a piece of content (usually auto-flagged by spam heuristics).
 */
export async function flagContent(params: {
  targetType: 'post' | 'comment';
  targetId: string;
  flagType: FlagType;
  severity?: FlagSeverity;
  source?: 'system' | 'user' | 'admin';
  flaggedBy?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('content_flags').insert({
    target_type: params.targetType,
    target_id: params.targetId,
    flag_type: params.flagType,
    severity: params.severity ?? 'medium',
    source: params.source ?? 'system',
    flagged_by: params.flaggedBy ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * User can report content + auto-flag if spam-suspected
 */
export async function reportPost(
  reporterId: string,
  postId: string,
  category: ReportCategory,
  reason: string,
  details?: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await submitReport({
    reporterId,
    targetType: 'post',
    targetId: postId,
    category,
    reason,
    details,
  });

  // Auto-flag if spam
  if (result.success && category === 'spam') {
    await flagContent({
      targetType: 'post',
      targetId: postId,
      flagType: 'spam',
      severity: 'medium',
      source: 'user',
      flaggedBy: reporterId,
    });
  }

  return result;
}

export async function reportUser(
  reporterId: string,
  targetUserId: string,
  category: ReportCategory,
  reason: string,
  details?: string,
): Promise<{ success: boolean; error?: string }> {
  return submitReport({
    reporterId,
    targetType: 'user',
    targetId: targetUserId,
    category,
    reason,
    details,
  });
}


// ─── Admin: Moderation Queue ───────────────────────────────

export async function getModerationQueue(
  status: string = 'pending',
  limit: number = 20,
  offset: number = 0,
): Promise<ModerationQueueItem[]> {
  const { data, error } = await supabase.rpc('get_moderation_queue', {
    p_status: status,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.warn('[moderation] queue error:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getReportsByTarget(
  targetType: 'post' | 'user',
  targetId: string,
): Promise<Report[]> {
  const { data } = await supabase
    .from('reports')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false });
  return (data ?? []) as Report[];
}


// ─── Admin: Take Action ────────────────────────────────────

/**
 * Log a moderation action and apply side effects.
 */
export async function takeAction(params: {
  moderatorId: string;
  targetType: 'post' | 'comment' | 'user' | 'report';
  targetId: string;
  action: ModerationAction;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  // 1. Log action
  const { error: logErr } = await supabase.from('moderation_actions').insert({
    moderator_id: params.moderatorId,
    target_type: params.targetType,
    target_id: params.targetId,
    action: params.action,
    reason: params.reason ?? null,
    metadata: params.metadata ?? {},
  });

  if (logErr) return { success: false, error: logErr.message };

  // 2. Apply side effects
  try {
    switch (params.action) {
      case 'remove_content':
        if (params.targetType === 'post') {
          await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', params.targetId);
        } else if (params.targetType === 'comment') {
          await supabase.from('comments').update({ deleted_at: new Date().toISOString() }).eq('id', params.targetId);
        }
        break;

      case 'restore_content':
        if (params.targetType === 'post') {
          await supabase.from('posts').update({ deleted_at: null }).eq('id', params.targetId);
        } else if (params.targetType === 'comment') {
          await supabase.from('comments').update({ deleted_at: null }).eq('id', params.targetId);
        }
        break;

      case 'warn_user':
        // Increment warning count
        await supabase.rpc('increment_warning_count', { p_user_id: params.targetId }).catch(() => {
          // Fallback: direct update
          supabase
            .from('profiles')
            .update({ warning_count: supabase.rpc ? undefined : 1 })
            .eq('id', params.targetId);
        });
        break;

      case 'suspend_user': {
        const days = (params.metadata?.days as number) || 7;
        const until = new Date(Date.now() + days * 86400000).toISOString();
        await supabase.from('profiles').update({ suspended_until: until }).eq('id', params.targetId);
        break;
      }

      case 'unsuspend_user':
        await supabase.from('profiles').update({ suspended_until: null }).eq('id', params.targetId);
        break;

      case 'ban_user':
        await supabase.from('profiles').update({ banned_at: new Date().toISOString() }).eq('id', params.targetId);
        break;

      case 'unban_user':
        await supabase.from('profiles').update({ banned_at: null }).eq('id', params.targetId);
        break;

      case 'dismiss_report':
        await supabase.from('reports').update({
          status: 'dismissed',
          reviewed_by: params.moderatorId,
          reviewed_at: new Date().toISOString(),
          resolution: 'dismissed',
        }).eq('id', params.targetId);
        break;

      case 'escalate_report':
        await supabase.from('reports').update({ status: 'escalated' }).eq('id', params.targetId);
        break;
    }
  } catch (e: any) {
    console.warn('[moderation] side effect error:', e.message);
  }

  return { success: true };
}


// ─── Admin: Resolve Report ─────────────────────────────────

export async function resolveReport(params: {
  reportId: string;
  moderatorId: string;
  resolution: ReportResolution;
  note?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('reports')
    .update({
      status: 'resolved',
      reviewed_by: params.moderatorId,
      reviewed_at: new Date().toISOString(),
      resolution: params.resolution,
      moderator_note: params.note ?? null,
    })
    .eq('id', params.reportId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}


// ─── Admin: Issue Warning ──────────────────────────────────

export async function issueWarning(params: {
  userId: string;
  issuedBy: string;
  reason: string;
  severity?: WarningSeverity;
  relatedId?: string;
  expiresInDays?: number;
}): Promise<{ success: boolean; error?: string }> {
  const expiresAt = params.expiresInDays
    ? new Date(Date.now() + params.expiresInDays * 86400000).toISOString()
    : null;

  const { error } = await supabase.from('user_warnings').insert({
    user_id: params.userId,
    issued_by: params.issuedBy,
    reason: params.reason,
    severity: params.severity ?? 'warning',
    related_id: params.relatedId ?? null,
    expires_at: expiresAt,
  });

  if (error) return { success: false, error: error.message };

  // Send notification to the warned user
  await supabase.from('notifications').insert({
    to_user_id: params.userId,
    from_user_id: params.issuedBy,
    type: 'warning',
    entity_id: params.relatedId ?? null,
    data: { reason: params.reason, severity: params.severity ?? 'warning' },
  });

  return { success: true };
}

export async function getUserWarnings(userId: string): Promise<UserWarning[]> {
  const { data } = await supabase
    .from('user_warnings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data ?? []) as UserWarning[];
}

/**
 * Acknowledge a warning (user has read it).
 */
export async function acknowledgeWarning(warningId: string): Promise<void> {
  await supabase
    .from('user_warnings')
    .update({ acknowledged_at: new Date().toISOString() })
    .eq('id', warningId);
}


// ─── Content Flags (admin) ─────────────────────────────────

export async function getUnresolvedFlags(
  limit = 20,
  offset = 0,
): Promise<ContentFlag[]> {
  const { data } = await supabase
    .from('content_flags')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);
  return (data ?? []) as ContentFlag[];
}

export async function resolveFlag(
  flagId: string,
  resolvedBy: string,
): Promise<void> {
  await supabase
    .from('content_flags')
    .update({
      resolved: true,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', flagId);
}


// ─── Trust Score ───────────────────────────────────────────

/**
 * Recompute a user's trust score based on warning history, reports filed
 * against them, and account age.
 *
 * Score: 100 (trusted) → 0 (untrusted)
 */
export async function computeTrustScore(userId: string): Promise<number> {
  const [warningsRes, reportsRes, profileRes] = await Promise.all([
    supabase
      .from('user_warnings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', 'user')
      .eq('target_id', userId)
      .eq('status', 'resolved'),
    supabase
      .from('profiles')
      .select('created_at, banned_at')
      .eq('id', userId)
      .single(),
  ]);

  let score = 100;

  // Deduct for warnings
  const warningCount = warningsRes.count ?? 0;
  score -= warningCount * 15;

  // Deduct for resolved reports against them
  const reportCount = reportsRes.count ?? 0;
  score -= reportCount * 10;

  // Bonus for account age (max +10 for 180+ days)
  if (profileRes.data) {
    const ageMs = Date.now() - new Date(profileRes.data.created_at).getTime();
    const ageDays = ageMs / 86400000;
    score += Math.min(ageDays / 18, 10);
  }

  // If banned, trust is 0
  if (profileRes.data?.banned_at) score = 0;

  score = Math.round(Math.max(0, Math.min(100, score)));

  // Persist
  await supabase.from('profiles').update({ trust_score: score }).eq('id', userId);

  return score;
}
