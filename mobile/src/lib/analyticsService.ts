/**
 * Analytics Service
 *
 * Lightweight event-tracking for the mobile app.
 *
 * Features:
 *   - Track screen views, taps, scrolls, media plays
 *   - Session management (start / end / heartbeat)
 *   - Feed engagement signals (view duration, completion, interaction)
 *   - Batched inserts to minimise Supabase calls
 *   - User interest profiling from reading behaviour
 */

import { supabase } from './supabase';
import { Platform } from 'react-native';
import * as Application from 'expo-application';

// ─── Types ─────────────────────────────────────────────────

export interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, unknown>;
  screen?: string;
}

export interface Session {
  id: string;
  startedAt: number; // epoch ms
}

// ─── Session management ────────────────────────────────────

let _currentSession: Session | null = null;
let _userId: string | null = null;
let _eventQueue: Array<AnalyticsEvent & { queued_at: number }> = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

const FLUSH_INTERVAL = 30_000; // flush every 30 s
const MAX_BATCH_SIZE = 50;

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Initialise analytics for a user. Call on app start / auth change.
 */
export function initAnalytics(userId: string): void {
  _userId = userId;
  startSession();
  scheduleFlush();
}

/**
 * Tear down analytics. Call on sign-out.
 */
export function teardownAnalytics(): void {
  endSession();
  flushQueue(); // best-effort
  _userId = null;
  if (_flushTimer) clearInterval(_flushTimer);
  _flushTimer = null;
}

export function startSession(): void {
  if (_currentSession) endSession();

  const sessionId = generateId();
  _currentSession = { id: sessionId, startedAt: Date.now() };

  if (!_userId) return;

  // Fire-and-forget insert
  supabase
    .from('user_sessions')
    .insert({
      id: sessionId,
      user_id: _userId,
      started_at: new Date().toISOString(),
      platform: Platform.OS as 'ios' | 'android',
      app_version: Application.nativeApplicationVersion ?? '1.0.0',
      device_info: {
        os: Platform.OS,
        version: Platform.Version,
      },
    })
    .then(() => {});
}

export function endSession(): void {
  if (!_currentSession || !_userId) return;

  const durationSec = Math.round((Date.now() - _currentSession.startedAt) / 1000);

  supabase
    .from('user_sessions')
    .update({
      ended_at: new Date().toISOString(),
      duration_sec: durationSec,
    })
    .eq('id', _currentSession.id)
    .then(() => {});

  _currentSession = null;
}


// ─── Event tracking ────────────────────────────────────────

/**
 * Track a single analytics event. Events are batched and flushed
 * periodically to reduce network calls.
 */
export function trackEvent(
  eventType: string,
  eventData?: Record<string, unknown>,
  screen?: string,
): void {
  _eventQueue.push({
    event_type: eventType,
    event_data: eventData,
    screen,
    queued_at: Date.now(),
  });

  // Flush immediately if queue is large
  if (_eventQueue.length >= MAX_BATCH_SIZE) {
    flushQueue();
  }
}

/** Convenience helpers */
export function trackScreenView(screen: string): void {
  trackEvent('screen_view', { screen }, screen);
}

export function trackPostView(postId: string, durationMs: number, screen?: string): void {
  trackEvent('post_view', { post_id: postId, duration_ms: durationMs }, screen);
}

export function trackReelWatch(reelId: string, watchDurationMs: number, totalDurationMs: number): void {
  const completion = totalDurationMs > 0 ? watchDurationMs / totalDurationMs : 0;
  trackEvent('reel_watch', {
    reel_id: reelId,
    watch_duration_ms: watchDurationMs,
    total_duration_ms: totalDurationMs,
    completion_pct: Math.round(completion * 100),
  });
}

export function trackEngagement(
  action: 'support' | 'dislike' | 'comment' | 'share' | 'save' | 'repost',
  entityId: string,
  screen?: string,
): void {
  trackEvent('engagement', { action, entity_id: entityId }, screen);
}

export function trackSearch(query: string, resultCount: number): void {
  trackEvent('search', { query, result_count: resultCount });
}

export function trackTap(element: string, screen?: string, extra?: Record<string, unknown>): void {
  trackEvent('tap', { element, ...extra }, screen);
}

export function trackError(error: string, context?: Record<string, unknown>): void {
  trackEvent('error', { error, ...context });
}


// ─── Batch flush ───────────────────────────────────────────

function scheduleFlush(): void {
  if (_flushTimer) return;
  _flushTimer = setInterval(flushQueue, FLUSH_INTERVAL);
}

async function flushQueue(): Promise<void> {
  if (_eventQueue.length === 0 || !_userId) return;

  const batch = _eventQueue.splice(0, MAX_BATCH_SIZE);

  const rows = batch.map((evt) => ({
    user_id: _userId!,
    event_type: evt.event_type,
    event_data: evt.event_data ?? {},
    screen: evt.screen ?? null,
    session_id: _currentSession?.id ?? null,
    created_at: new Date(evt.queued_at).toISOString(),
  }));

  const { error } = await supabase.from('analytics_events').insert(rows);
  if (error) {
    console.warn('[analytics] flush error:', error.message);
    // Re-queue failed events (but cap to prevent memory leak)
    if (_eventQueue.length < 200) {
      _eventQueue.unshift(...batch);
    }
  }
}


// ─── User interest profiling ───────────────────────────────

/**
 * Update a user's interest score for a given category.
 * Called when they view / interact with posts in that category.
 *
 * Uses exponential moving average: new_score = α * signal + (1 - α) * old_score
 */
export async function updateInterest(
  userId: string,
  category: string,
  signal: number = 1.0,
  alpha: number = 0.3,
): Promise<void> {
  // Fetch existing score
  const { data } = await supabase
    .from('user_interests')
    .select('score')
    .eq('user_id', userId)
    .eq('category', category)
    .single();

  const oldScore = data?.score ?? 0;
  const newScore = alpha * signal + (1 - alpha) * oldScore;

  await supabase.from('user_interests').upsert(
    {
      user_id: userId,
      category,
      score: Math.round(newScore * 100) / 100,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,category' },
  );
}

/**
 * Get a user's top interest categories.
 */
export async function getTopInterests(
  userId: string,
  limit: number = 5,
): Promise<Array<{ category: string; score: number }>> {
  const { data } = await supabase
    .from('user_interests')
    .select('category, score')
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .limit(limit);
  return (data ?? []) as Array<{ category: string; score: number }>;
}


// ─── Metrics helpers (admin dashboards) ────────────────────

export async function getDailyMetric(
  metricName: string,
  startDate: string,
  endDate: string,
): Promise<Array<{ metric_date: string; metric_value: number }>> {
  const { data } = await supabase
    .from('daily_metrics')
    .select('metric_date, metric_value')
    .eq('metric_name', metricName)
    .gte('metric_date', startDate)
    .lte('metric_date', endDate)
    .order('metric_date', { ascending: true });
  return (data ?? []) as Array<{ metric_date: string; metric_value: number }>;
}

/**
 * Increment a daily counter. Uses upsert with the unique constraint.
 * Call from cron jobs or edge functions for aggregate metrics.
 */
export async function incrementDailyMetric(
  metricName: string,
  date: string,
  increment: number = 1,
  dimensions: Record<string, unknown> = {},
): Promise<void> {
  // Try to increment existing
  const { data: existing } = await supabase
    .from('daily_metrics')
    .select('id, metric_value')
    .eq('metric_name', metricName)
    .eq('metric_date', date)
    .eq('dimensions', JSON.stringify(dimensions))
    .single();

  if (existing) {
    await supabase
      .from('daily_metrics')
      .update({ metric_value: existing.metric_value + increment })
      .eq('id', existing.id);
  } else {
    await supabase.from('daily_metrics').insert({
      metric_name: metricName,
      metric_date: date,
      metric_value: increment,
      dimensions,
    });
  }
}
