/** CEFR levels plus "GK": everyday spoken German (günlük konuşma) */
export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "GK"] as const;
export type Level = (typeof LEVELS)[number];

export const MIXED_TOPIC = "mixed";

export interface Topic {
  id: string;
  level: Level;
  /** Turkish display name */
  name: string;
  /** Short description of the grammar focus, also sent to the model */
  focus: string;
}

export interface VocabItem {
  /** German, with article / government, e.g. "der Vater", "helfen (+D)" */
  de: string;
  tr: string;
}

/** A spot in the reference translation where a grammar rule is tested. */
export interface Focus {
  /** Rule id from the grammar rule bank (lib/grammar/rules.ts) */
  rule: string;
  /** Fragment of the reference translation that embodies the rule, e.g. "meinem Vater" */
  expect: string;
  /** Typical wrong forms learners write here, with the reason in Turkish */
  wrong?: { form: string; why: string }[];
  /** Reason shown when this part is simply missing from the answer */
  missing?: string;
}

export interface Exercise {
  id: string;
  level: Level;
  topicId: string;
  tr: string;
  /** Accepted German translations, most natural first */
  de: string[];
  vocab: VocabItem[];
  /** Turkish hint about the key rule */
  hint: string;
  source: "seed" | "gen" | "followup";
  /** Grammar rules this sentence practices */
  ruleIds?: string[];
  focus?: Focus[];
  /** Generator template that produced it (similar sentences come from the same template) */
  templateId?: string;
}

export const ERROR_CATEGORIES = [
  "artikel",
  "hal",
  "fiil_cekimi",
  "kelime_sirasi",
  "edat",
  "kelime_secimi",
  "zaman",
  "yazim",
  "buyuk_harf",
  "eksik_kelime",
  "fazla_kelime",
  "anlam",
  "diger",
] as const;
export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ErrorCategory, string> = {
  artikel: "Artikel (der/die/das)",
  hal: "Hal (Kasus)",
  fiil_cekimi: "Fiil çekimi",
  kelime_sirasi: "Kelime sırası",
  edat: "Edat",
  kelime_secimi: "Kelime seçimi",
  zaman: "Zaman / kip",
  yazim: "Yazım ve noktalama",
  buyuk_harf: "Büyük/küçük harf",
  eksik_kelime: "Eksik kelime",
  fazla_kelime: "Fazla kelime",
  anlam: "Anlam",
  diger: "Diğer",
};

export type Verdict = "correct" | "almost" | "incorrect";

/** The sentence pattern behind a mistake: "in this pattern, X is used". */
export interface RuleInfo {
  /** Rule bank id, when the rule comes from lib/grammar/rules.ts */
  id?: string;
  title: string;
  /** Turkish: how the pattern works */
  pattern: string;
  /** Short German example sentences */
  examples: string[];
}

export interface GradeError {
  /** Exact fragment from the learner's answer ("" when something is missing) */
  wrong: string;
  fix: string;
  category: ErrorCategory;
  /** Turkish: why this specific form is wrong here */
  explanation: string;
  turkishTip: string | null;
  rule: RuleInfo | null;
}

export interface Followup {
  tr: string;
  de: string[];
  hint: string;
  vocab: VocabItem[];
}

export interface GradeResult {
  verdict: Verdict;
  score: number;
  corrected: string;
  natural: string;
  errors: GradeError[];
  praise: string | null;
  summary: string;
  focusTopic: string | null;
  followup: Followup | null;
  /** Small things that were not counted as errors (capitalization, punctuation, umlaut spelling) */
  notes: string[];
  /** exact: matched an accepted translation, local: compared word by word with the rule bank */
  source: "exact" | "local";
}

