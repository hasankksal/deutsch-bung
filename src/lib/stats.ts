import { dayKey, type AppState } from "./store";
import type { ErrorCategory } from "./types";

export function streakDays(s: AppState, now = new Date()): number {
  const days = new Set(s.practiceDays);
  const cursor = new Date(now);
  // A streak still counts if today is not practiced yet but yesterday was.
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function todayCount(s: AppState, now = new Date()): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return s.attempts.filter((a) => a.at >= start.getTime()).length;
}

/** Correct answers in a row, counting back from the latest attempt. */
export function correctStreak(s: AppState): number {
  const i = s.attempts.findIndex((a) => a.verdict !== "correct");
  return i < 0 ? s.attempts.length : i;
}

export function accuracy(s: AppState): number | null {
  if (!s.attempts.length) return null;
  const ok = s.attempts.filter((a) => a.verdict === "correct").length;
  return Math.round((100 * ok) / s.attempts.length);
}

export function topCategories(s: AppState, limit = 8): { category: ErrorCategory; count: number }[] {
  return (Object.entries(s.categoryCounts) as [ErrorCategory, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, count]) => ({ category, count }));
}

export function timeAgo(ts: number, now = Date.now()): string {
  const min = Math.round((now - ts) / 60_000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} saat önce`;
  const d = Math.round(h / 24);
  return `${d} gün önce`;
}

export function dueIn(ts: number, now = Date.now()): string {
  const diff = ts - now;
  if (diff <= 0) return "şimdi";
  const h = Math.round(diff / 3_600_000);
  if (h < 24) return h <= 1 ? "1 saat içinde" : `${h} saat sonra`;
  return `${Math.round(h / 24)} gün sonra`;
}
