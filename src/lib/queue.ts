import { generateBatch, generateSimilar } from "./generator";
import { SEED_EXERCISES } from "./seed-sentences";
import type { AppState, ReviewItem } from "./store";
import { MIXED_TOPIC, type Exercise, type GradeResult, type Level } from "./types";

/** Hand-written sentences for a level/topic (template sentences are made on demand). */
export function candidatePool(level: Level, topicId: string): Exercise[] {
  return SEED_EXERCISES.filter(
    (e) => e.level === level && (topicId === MIXED_TOPIC || e.topicId === topicId),
  );
}

const randomOf = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/** Sentences shown this recently never come back, even when a small pattern runs out. */
const RECENT = 40;

/**
 * Next sentence: a mix of hand-written sentences (while unseen ones remain) and freshly generated
 * ones. If the generators have nothing new for this topic, older generated sentences come back
 * before the hand-written ones repeat.
 */
export function pickNext(s: AppState, level: Level, topicId: string, excludeIds: string[] = []): Exercise | null {
  const seen = new Set([...s.seen, ...excludeIds]);
  const pool = candidatePool(level, topicId).filter((e) => !excludeIds.includes(e.id));
  const unseen = pool.filter((e) => !seen.has(e.id));
  const generated = generateBatch({ level, topicId, count: 6, avoid: seen });
  if (unseen.length && (Math.random() < 0.3 || !generated.length)) return randomOf(unseen);
  if (generated.length) return randomOf(generated);
  const again = generateBatch({ level, topicId, count: 6, avoid: new Set([...s.seen.slice(0, RECENT), ...excludeIds]) });
  if (again.length) return randomOf(again);
  if (!pool.length) return null;
  const order = new Map(s.seen.map((id, i) => [id, i]));
  return [...pool].sort((a, b) => (order.get(b.id) ?? Infinity) - (order.get(a.id) ?? Infinity))[0];
}

export function dueReviews(s: AppState, now = Date.now()): ReviewItem[] {
  return s.review.filter((r) => r.due <= now).sort((a, b) => a.due - b.due);
}

/**
 * "Now your turn": a new sentence on the rule the learner just got wrong. Generated from the same
 * pattern when possible, otherwise another sentence of the same topic.
 */
export function similarExercise(s: AppState, base: Exercise, result: GradeResult | null, excludeIds: string[] = []): Exercise | null {
  const avoid = new Set([...s.seen, ...excludeIds, base.id]);
  const rule = result?.errors.find((e) => e.rule?.id)?.rule?.id;
  const generated = generateSimilar(base, avoid, rule) ?? (rule ? generateSimilar(base, avoid) : null);
  if (generated) return generated;
  const pool = candidatePool(base.level, base.topicId).filter((e) => !avoid.has(e.id));
  return pool.length ? randomOf(pool) : null;
}
