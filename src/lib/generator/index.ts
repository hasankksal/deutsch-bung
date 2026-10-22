import { TOPIC_RULES } from "../grammar/rules";
import { MIXED_TOPIC, type Exercise, type Level } from "../types";
import { A1 } from "./a1";
import { A2 } from "./a2";
import { B1 } from "./b1";
import { B2C1 } from "./b2c1";
import { run, type Template } from "./engine";
import { OPEN_A } from "./open-a";
import { OPEN_B1 } from "./open-b1";
import { OPEN_B2C1 } from "./open-b2c1";
import { OPEN_C1 } from "./open-c1";
import { C1_BANK } from "./c1-bank";
import { SPOKEN } from "./spoken";
import { SPOKEN_BANK } from "./spoken-bank";

/** Hand-written pattern templates plus the open-ended ones that combine events, subjects and connectors. */
export const TEMPLATES: Template[] = [...A1, ...A2, ...B1, ...B2C1, ...OPEN_A, ...OPEN_B1, ...OPEN_B2C1, ...OPEN_C1, ...C1_BANK, ...SPOKEN_BANK, ...SPOKEN];

function matching(level: Level, topicId: string, rule?: string): Template[] {
  return TEMPLATES.filter(
    (t) => t.level === level && (topicId === MIXED_TOPIC || t.topicId === topicId) && (!rule || t.rules.includes(rule)),
  );
}

export function hasTemplates(level: Level, topicId: string): boolean {
  return matching(level, topicId).length > 0;
}

/** Up to `count` fresh sentences for a level/topic (optionally practicing one rule), skipping ids in `avoid`. */
export function generateBatch(o: {
  level: Level;
  topicId: string;
  count: number;
  avoid: Set<string>;
  rule?: string;
  templateId?: string;
  rand?: () => number;
}): Exercise[] {
  const rand = o.rand ?? Math.random;
  const pool = o.templateId ? TEMPLATES.filter((t) => t.id === o.templateId) : matching(o.level, o.topicId, o.rule);
  if (!pool.length) return [];
  const out: Exercise[] = [];
  const ids = new Set<string>();
  for (let attempt = 0; attempt < o.count * 15 && out.length < o.count; attempt++) {
    const ex = run(pool[Math.floor(rand() * pool.length)], rand);
    if (o.avoid.has(ex.id) || ids.has(ex.id)) continue;
    ids.add(ex.id);
    out.push(ex);
  }
  return out;
}

/**
 * A new sentence that practices the same rule as `ex` ("now your turn"): same template first,
 * then any template of that level teaching the rule the learner got wrong.
 */
export function generateSimilar(ex: Exercise, avoid: Set<string>, rule?: string): Exercise | null {
  const skip = new Set([...avoid, ex.id]);
  const rules = rule ? [rule] : (ex.ruleIds ?? TOPIC_RULES[ex.topicId] ?? []);
  if (ex.templateId && (!rule || ex.ruleIds?.includes(rule))) {
    const same = generateBatch({ level: ex.level, topicId: ex.topicId, count: 1, avoid: skip, templateId: ex.templateId });
    if (same.length) return same[0];
  }
  for (const r of rules) {
    const viaRule = generateBatch({ level: ex.level, topicId: MIXED_TOPIC, count: 1, avoid: skip, rule: r });
    if (viaRule.length) return viaRule[0];
  }
  const sameTopic = generateBatch({ level: ex.level, topicId: ex.topicId, count: 1, avoid: skip });
  return sameTopic[0] ?? null;
}
