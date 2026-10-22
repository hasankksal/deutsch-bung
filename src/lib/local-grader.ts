import { expandContractions } from "./grammar/de";
import { ORDER_RULES, ruleInfo, TOPIC_RULES } from "./grammar/rules";
import { joinTokens, normalizeAnswer, tokenize } from "./text";
import type { ErrorCategory, Exercise, Focus, GradeError, GradeResult, RuleInfo, Verdict } from "./types";

// Offline grading. Compares the answer with the closest accepted translation, ignores trivial
// differences (capitalization, punctuation, umlaut spelling, contractions) and explains each real
// mistake with the grammar rule behind it: the sentence's own "focus" spots first, heuristics second.

export interface LocalGrade {
  result: GradeResult;
  /** True when every mistake was matched to a specific reason */
  confident: boolean;
}

// ---------- lenient comparison ----------

const DIGRAPH: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
const PLAIN: Record<string, string> = { ä: "a", ö: "o", ü: "u", ß: "ss" };

/** Learner token vs reference token: case-insensitive, accepts ae/oe/ue/ss and missing umlaut dots. */
export function tokEq(user: string, ref: string): boolean {
  // apostrophes are optional in spoken short forms: geht's = gehts
  const u = user.toLowerCase().replace(/'/g, "");
  const r = ref.toLowerCase().replace(/'/g, "");
  return (
    u === r ||
    u === r.replace(/[äöüß]/g, (c) => DIGRAPH[c]) ||
    u === r.replace(/[äöüß]/g, (c) => PLAIN[c]) ||
    u === r.replace(/ß/g, "s")
  );
}

const isWord = (t: string) => /[\p{L}\p{N}]/u.test(t);

// ---------- spoken short forms ----------

/** Short forms written without their apostrophe: gibts = gibt es. */
const NO_APOSTROPHE = new Set(["gibts", "gehts", "wärs", "hats", "läufts", "klappts", "passts", "stimmts", "gings", "gabs", "habs", "machs", "versuchs", "kriegs", "schaffs", "sags"]);

/** Everyday spoken forms (level GK) and the full form they stand for. */
const SPOKEN_FULL: Record<string, string> = {
  hab: "habe",
  hätt: "hätte",
  wär: "wäre",
  würd: "würde",
  nix: "nichts",
  nee: "nein",
  grad: "gerade",
  nich: "nicht",
  is: "ist",
  nen: "einen",
  ne: "eine",
  nem: "einem",
  ner: "einer",
  n: "ein",
  drauf: "darauf",
  dran: "daran",
  drin: "darin",
  drüber: "darüber",
  drum: "darum",
  drunter: "darunter",
};

/** First person forms that drop their final -e in speech (ich geh, mach ich). */
const ICH_APOCOPE = new Set(
  "gehe komme mache rufe schreibe glaube finde denke frage sage hoffe sehe nehme bringe melde schaue gucke kaufe brauche bleibe fahre esse trinke spiele lerne schaffe kriege bestelle hole versuche verstehe erzähle zahle gebe lasse checke ziehe lege stelle suche probiere".split(" "),
);

/** Modal particles and fillers that only color a spoken sentence (mal, doch, echt …). */
const PARTICLES = new Set(["doch", "mal", "halt", "eben", "ja", "eigentlich", "echt", "wirklich", "total", "voll", "bloß", "wohl", "einfach", "ruhig", "überhaupt", "gar"]);

/** geht's → geht es, gibts → gibt es, nochmal → noch mal, gerne → gern */
function splitClitics(ws: string[]): string[] {
  return ws.flatMap((w) => {
    const m = /^(.+)'s$/i.exec(w);
    if (m) return [m[1], "es"];
    const low = w.toLowerCase();
    if (NO_APOSTROPHE.has(low)) return [w.slice(0, -1), "es"];
    if (low === "nochmal") return [w.slice(0, 4), "mal"];
    if (low === "gerne") return [w.slice(0, 4)];
    return [w];
  });
}

/** hab → habe, 'nen → einen, ich geh → ich gehe: spoken and full forms compare equal. */
function fullForms(ws: string[]): string[] {
  return ws.map((w, i) => {
    const low = w.toLowerCase();
    if (SPOKEN_FULL[low]) return SPOKEN_FULL[low];
    const nearIch = ws[i - 1]?.toLowerCase() === "ich" || ws[i + 1]?.toLowerCase() === "ich";
    return nearIch && ICH_APOCOPE.has(low + "e") ? w + "e" : w;
  });
}

/** Word tokens with contractions expanded (ins → in das) and punctuation dropped; `spoken` also evens out short spoken forms. */
export function words(s: string, spoken = false): string[] {
  const ws = splitClitics(tokenize(expandContractions(normalizeAnswer(s))).filter(isWord));
  return spoken ? fullForms(ws) : ws;
}

interface Op {
  type: "same" | "del" | "add";
  u?: string;
  r?: string;
  /** index in the reference word list (insertion point for deletions) */
  ri: number;
}

function align(a: string[], b: string[], eq: (x: string, y: string) => boolean = tokEq): Op[] {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (eq(a[i], b[j])) ops.push({ type: "same", u: a[i++], r: b[j], ri: j++ });
    else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push({ type: "del", u: a[i++], ri: j });
    else ops.push({ type: "add", r: b[j], ri: j++ });
  }
  while (i < a.length) ops.push({ type: "del", u: a[i++], ri: j });
  while (j < b.length) ops.push({ type: "add", r: b[j], ri: j++ });
  return ops;
}

const lcs = (a: string[], b: string[]) => align(a, b).filter((o) => o.type === "same").length;

/** Character-level similarity 0..1, used to break ties between equally close references. */
function charSimilarity(a: string, b: string): number {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    for (let j = 1; j <= y.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[y.length] / Math.max(1, x.length, y.length);
}

/**
 * Lenient token alignment for display (inline diff of the learner's sentence vs the corrected one).
 * `spoken`: short spoken forms count as the same word (hab = habe), as the grader does at level GK.
 */
export function alignForDisplay(answer: string, target: string, spoken = false): { type: "same" | "del" | "add"; text: string }[] {
  const a = tokenize(normalizeAnswer(answer));
  const b = tokenize(normalizeAnswer(target));
  const full = (w: string) => {
    const low = w.toLowerCase().replace(/'/g, "");
    return low === "gerne" ? "gern" : spoken ? (SPOKEN_FULL[low] ?? low) : low;
  };
  const eq = (x: string, y: string) => tokEq(x, y) || full(x) === full(y);
  return align(a, b, eq).map((o) => ({ type: o.type, text: (o.type === "add" ? o.r : o.u) ?? "" }));
}

// ---------- small word lists for heuristics ----------

const ARTICLES = new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines"]);
const DETERMINER_STEMS = ["kein", "mein", "dein", "sein", "ihr", "unser", "euer", "eur", "ein", "dies", "jed", "welch"];
const PRONOUN_GROUPS = [
  ["ich", "mich", "mir"],
  ["du", "dich", "dir"],
  ["er", "ihn", "ihm"],
  ["es", "ihm"],
  ["sie", "ihr", "ihnen"],
  ["wir", "uns"],
  ["ihr", "euch"],
];
const DATIV_PREP = new Set(["mit", "nach", "bei", "seit", "von", "zu", "aus", "gegenüber"]);
const AKK_PREP = new Set(["für", "durch", "gegen", "ohne", "um"]);
const WECHSEL_PREP = new Set(["in", "an", "auf", "über", "unter", "vor", "hinter", "neben", "zwischen"]);
const GEN_PREP = new Set(["wegen", "trotz", "während", "statt"]);
const PREPOSITIONS = new Set([...DATIV_PREP, ...AKK_PREP, ...WECHSEL_PREP, ...GEN_PREP]);
const REFLEXIVES = new Set(["mich", "dich", "sich", "uns", "euch"]);
const SEP_PREFIXES = new Set(["an", "auf", "aus", "ein", "mit", "zu", "ab", "vor", "fern", "zurück", "weg", "los", "teil", "kennen", "um"]);
const CONJUNCTIONS = ["weil", "denn", "dass", "wenn", "obwohl", "als", "damit", "um", "ob", "bevor", "nachdem", "während"];
const DATIV_VERB = /^(helf|hilf|geholfen|dank|gedankt|antwort|geantwortet|gratulier|gefäll|gefall|gefiel|gehör|pass|folg|geglaubt|glaub)/i;

function determinerStem(word: string): string | null {
  const w = word.toLowerCase();
  if (/^d(er|ie|as|en|em|es)$/.test(w)) return "d";
  for (const stem of DETERMINER_STEMS) {
    if (w === stem || (w.startsWith(stem) && /^(e|en|em|er|es)$/.test(w.slice(stem.length)))) return stem;
  }
  return null;
}

const samePronoun = (a: string, b: string) =>
  PRONOUN_GROUPS.some((g) => g.includes(a.toLowerCase()) && g.includes(b.toLowerCase()));

function shapeCategory(wrong: string[], fix: string[]): ErrorCategory {
  if (!wrong.length) return "eksik_kelime";
  if (!fix.length) return "fazla_kelime";
  const w = wrong[0];
  const f = fix[0];
  if (samePronoun(w, f)) return "hal";
  const ws = determinerStem(w);
  const fs = determinerStem(f);
  if (ws && fs) {
    const wl = w.toLowerCase();
    const fl = f.toLowerCase();
    if (["der", "die", "das"].includes(wl) && ["der", "die", "das"].includes(fl)) return "artikel";
    if (ws === fs && ((wl === ws && fl === ws + "e") || (fl === ws && wl === ws + "e"))) return "artikel";
    return ws === fs || ws === "d" || fs === "d" ? "hal" : "kelime_secimi";
  }
  if (PREPOSITIONS.has(w.toLowerCase()) && PREPOSITIONS.has(f.toLowerCase())) return "edat";
  if (w.length > 3 && f.length > 3 && w.slice(0, 3).toLowerCase() === f.slice(0, 3).toLowerCase()) {
    return /^(ge|.+t$|.+en$)/i.test(f) ? "fiil_cekimi" : "kelime_secimi";
  }
  return "kelime_secimi";
}

const RULE_CATEGORY: Record<string, ErrorCategory> = {
  akkusativ: "hal",
  dativ: "hal",
  "dativ-verben": "hal",
  gefallen: "hal",
  "dativ-praep": "hal",
  wechsel: "hal",
  genitiv: "hal",
  relativ: "hal",
  adjektiv: "hal",
  reflexiv: "hal",
  "partizip-attr": "hal",
  kasus: "hal",
  artikel: "artikel",
  "eksik-artikel": "eksik_kelime",
  praesens: "fiil_cekimi",
  sein: "fiil_cekimi",
  haben: "fiil_cekimi",
  modal: "fiil_cekimi",
  perfekt: "fiil_cekimi",
  partizip2: "fiil_cekimi",
  passiv: "fiil_cekimi",
  "passiv-modal": "fiil_cekimi",
  zustandspassiv: "fiil_cekimi",
  "zu-infinitiv": "fiil_cekimi",
  "fiil-cekimi": "fiil_cekimi",
  praeteritum: "zaman",
  konjunktiv2: "zaman",
  konj1: "zaman",
  "konj2-vergangen": "zaman",
  plusquam: "zaman",
  trennbar: "kelime_sirasi",
  v2: "kelime_sirasi",
  nebensatz: "kelime_sirasi",
  "w-frage": "kelime_sirasi",
  "ja-nein-frage": "kelime_sirasi",
  obwohl: "kelime_sirasi",
  "kelime-sirasi": "kelime_sirasi",
  "praep-verben": "edat",
  "freuen-auf-ueber": "edat",
  "indirekte-frage": "kelime_sirasi",
  "sobald-bis": "kelime_sirasi",
  "statt-zu": "fiil_cekimi",
  pronomen: "artikel",
  doppelinfinitiv: "kelime_sirasi",
  "konnektoren-c1": "kelime_sirasi",
  "als-ob": "zaman",
  passiversatz: "fiil_cekimi",
  vermutung: "fiil_cekimi",
};

const ORDER_WHY: Record<string, string> = {
  v2: "Ana cümlede çekimli fiil 2. sırada olmalı.",
  nebensatz: "Yan cümlede çekimli fiil en sona gider.",
  "weil-denn": "weil'den sonra çekimli fiil en sona gider.",
  obwohl: "Yan cümlede çekimli fiil en sona gider; yan cümle başta ise ana cümle fiille başlar.",
  "als-wenn": "Yan cümlede çekimli fiil en sona gider; yan cümle başta ise ana cümle fiille başlar.",
  "bevor-nachdem": "Yan cümlede çekimli fiil en sona gider.",
  trennbar: "Ayrılabilen fiilin ön eki cümlenin en sonuna gider.",
  perfekt: "Yardımcı fiil 2. sırada, Partizip II en sonda olmalı.",
  modal: "Modal fiil 2. sırada, asıl fiil mastar hâlinde en sonda olmalı.",
  "w-frage": "Soru kelimesinden hemen sonra çekimli fiil gelir.",
  "ja-nein-frage": "Evet/hayır sorusunda çekimli fiil başa gelir.",
  relativ: "İlgi cümlesinde çekimli fiil en sona gider.",
  passiv: "werden 2. sırada, Partizip II en sonda olmalı.",
  "passiv-modal": "Sonda önce Partizip II, sonra werden gelir.",
  konjunktiv2: "würde 2. sırada, mastar en sonda olmalı.",
  "zu-infinitiv": "zu + mastar en sona gider.",
  plusquam: "Yardımcı fiil 2. sırada, Partizip II en sonda olmalı.",
  "indirekte-frage": "Dolaylı soruda (ob, wie, warum …) özne soru kelimesinden sonra gelir, çekimli fiil en sona gider.",
  "statt-zu": "statt … zu yapısında zu + mastar en sona gider.",
  "sobald-bis": "sobald / bis / als yan cümlesinde çekimli fiil en sona gider.",
  doppelinfinitiv: "Çift mastarlı yan cümlede çekimli fiil (hätte) iki mastarın önüne gelir: … hätte anrufen sollen.",
  "konnektoren-c1": "Bu bağlaç yan cümle açar, çekimli fiil sona gider (es sei denn'den sonra ise fiil 2. sırada kalır).",
  "als-ob": "als ob'dan sonra fiil sona gider; sadece als kullanılırsa Konjunktiv II hemen arkasından gelir.",
};

// ---------- notes about ignored slips ----------

function trivialNotes(pairs: { u: string; r: string }[], answer: string, ref: string): string[] {
  const notes: string[] = [];
  const noApostrophe = (s: string) => s.toLowerCase().replace(/'/g, "");
  const caseWords = pairs.filter((x) => x.u !== x.r && x.u.toLowerCase() === x.r.toLowerCase()).map((x) => x.r);
  const apostropheWords = [
    ...pairs.filter((x) => x.u.toLowerCase() !== x.r.toLowerCase() && noApostrophe(x.u) === noApostrophe(x.r)).map((x) => x.r),
    ...tokenize(answer)
      .filter((w) => NO_APOSTROPHE.has(w.toLowerCase()))
      .map((w) => `${w.slice(0, -1)}'s`),
  ];
  const spellWords = pairs.filter((x) => noApostrophe(x.u) !== noApostrophe(x.r)).map((x) => x.r);
  if (caseWords.length) {
    notes.push(`Büyük/küçük harf: ${[...new Set(caseWords)].slice(0, 4).join(", ")}. Almancada isimler ve cümlenin ilk kelimesi büyük harfle yazılır.`);
  }
  if (apostropheWords.length) {
    notes.push(
      `Kesme işareti: ${[...new Set(apostropheWords)].slice(0, 4).join(", ")}. Konuşma dili kısaltmalarında (geht's = geht es) yazılır, yazmasan da anlaşılır.`,
    );
  }
  if (spellWords.length) {
    notes.push(`Yazım: ${[...new Set(spellWords)].slice(0, 4).join(", ")}. ä, ö, ü, ß yazamıyorsan ae, oe, ue, ss de anlaşılır.`);
  }
  const userCommas = (normalizeAnswer(answer).match(/,/g) ?? []).length;
  const refCommas = (ref.match(/,/g) ?? []).length;
  if (userCommas < refCommas) {
    notes.push(
      /,\s*(weil|dass|wenn|obwohl|als|ob|damit|bevor|nachdem|während|um|der|die|das|den|dem|denen)\b/i.test(ref)
        ? "Virgül: yan cümle (weil, dass, wenn, obwohl…) ana cümleden virgülle ayrılır."
        : "Virgül: Almancada ünlem ve hitaplardan (Na, Ach, Sorry …) ve iki cümle arasında virgül konur.",
    );
  }
  if (/\b(in dem|in das|an dem|an das|zu dem|zu der|bei dem|von dem)\b/i.test(answer) && /\b(im|ins|am|ans|zum|zur|beim|vom)\b/.test(ref)) {
    notes.push("Kaynaşma: 'in dem' yerine genelde 'im', 'in das' yerine 'ins', 'zu dem' yerine 'zum' denir.");
  }
  return notes;
}

// ---------- error groups ----------

interface Group {
  wrong: string[];
  fix: string[];
  /** span in the reference words [start, end); start === end for a pure extra word */
  start: number;
  end: number;
}

function groupOps(ops: Op[]): { groups: Group[]; same: { u: string; r: string }[] } {
  const groups: Group[] = [];
  const same: { u: string; r: string }[] = [];
  let cur: Group | null = null;
  for (const op of ops) {
    if (op.type === "same") {
      if (cur) groups.push(cur);
      cur = null;
      same.push({ u: op.u!, r: op.r! });
      continue;
    }
    if (op.type === "del" && cur && cur.fix.length) {
      groups.push(cur);
      cur = null;
    }
    cur ??= { wrong: [], fix: [], start: op.ri, end: op.ri };
    if (op.type === "del") cur.wrong.push(op.u!);
    else {
      cur.fix.push(op.r!);
      cur.end = op.ri + 1;
    }
  }
  if (cur) groups.push(cur);
  return { groups, same };
}

interface FocusSpan {
  focus: Focus;
  start: number;
  end: number;
}

function findSpan(refWords: string[], phrase: string, spoken: boolean): [number, number] | null {
  const p = words(phrase, spoken);
  if (!p.length) return null;
  for (let i = 0; i + p.length <= refWords.length; i++) {
    if (p.every((w, k) => tokEq(w, refWords[i + k]))) return [i, i + p.length];
  }
  return null;
}

function containsPhrase(userWords: string[], phrase: string, spoken: boolean): boolean {
  const p = words(phrase, spoken);
  if (!p.length) return false;
  for (let i = 0; i + p.length <= userWords.length; i++) {
    if (p.every((w, k) => tokEq(userWords[i + k], w))) return true;
  }
  return false;
}

const overlaps = (g: Group, f: FocusSpan) =>
  g.start === g.end ? g.start >= f.start && g.start <= f.end : g.start < f.end && g.end > f.start;

function toRuleInfo(id: string | undefined): { rule: RuleInfo | null; tip: string | null } {
  const r = ruleInfo(id);
  return r ? { rule: { id: r.id, title: r.title, pattern: r.pattern, examples: r.examples }, tip: r.turkishTip } : { rule: null, tip: null };
}

interface Ctx {
  refWords: string[];
  userWords: string[];
  rules: string[];
  spans: FocusSpan[];
  spoken: boolean;
}

function heuristicRule(g: Group, category: ErrorCategory, ctx: Ctx): string | undefined {
  const prev = ctx.refWords[g.start - 1]?.toLowerCase();
  const find = (ids: string[]) => ctx.rules.find((r) => ids.includes(r));
  switch (category) {
    case "hal":
      if (prev && DATIV_PREP.has(prev)) return "dativ-praep";
      if (prev && GEN_PREP.has(prev)) return "genitiv";
      if (prev && WECHSEL_PREP.has(prev)) return find(["wechsel", "praep-verben"]) ?? "wechsel";
      if (prev && AKK_PREP.has(prev)) return "akkusativ";
      if (ctx.refWords.some((w) => DATIV_VERB.test(w))) return find(["gefallen", "dativ-verben"]) ?? "dativ-verben";
      return find(["akkusativ", "dativ", "dativ-verben", "gefallen", "wechsel", "genitiv", "relativ", "praep-verben", "adjektiv", "reflexiv"]) ?? "kasus";
    case "artikel":
      return "artikel";
    case "fiil_cekimi":
      return find(["praesens", "modal", "perfekt", "partizip2", "praeteritum", "konjunktiv2", "konj1", "passiv", "passiv-modal", "sein", "haben", "plusquam"]) ?? "fiil-cekimi";
    case "edat":
      return find(["praep-verben", "dativ-praep", "wechsel", "freuen-auf-ueber"]);
    case "eksik_kelime": {
      const f = g.fix[0]?.toLowerCase() ?? "";
      if (ARTICLES.has(f) || determinerStem(f)) return "eksik-artikel";
      if (REFLEXIVES.has(f)) return "reflexiv";
      if (f === "zu") return "zu-infinitiv";
      if (SEP_PREFIXES.has(f) && g.end === ctx.refWords.length) return "trennbar";
      return ctx.rules[0];
    }
    case "fazla_kelime":
      if (g.wrong[0]?.toLowerCase() === "zu" && ctx.rules.includes("modal")) return "modal";
      return ctx.rules[0];
    case "kelime_sirasi":
      return ctx.rules.find((r) => ORDER_RULES.has(r)) ?? "kelime-sirasi";
    default:
      return ctx.rules[0];
  }
}

function describe(g: Group, wrong: string, fix: string): string {
  if (!g.wrong.length) return `Burada "${fix}" eksik.`;
  if (!g.fix.length) return `"${wrong}" bu cümlede fazla.`;
  return `Sen "${wrong}" yazdın, burada "${fix}" olmalı.`;
}

function explainGroup(g: Group, ctx: Ctx): { error: GradeError; specific: boolean } {
  const wrong = joinTokens(g.wrong);
  const fix = joinTokens(g.fix);
  const matched = ctx.spans.filter((s) => overlaps(g, s));
  let chosen: { focus: Focus; why?: string; len: number } | null = null;
  for (const s of matched) {
    for (const w of s.focus.wrong ?? []) {
      if (containsPhrase(ctx.userWords, w.form, ctx.spoken) && (!chosen?.why || w.form.length > chosen.len)) {
        chosen = { focus: s.focus, why: w.why, len: w.form.length };
      }
    }
  }
  if (!chosen && !g.wrong.length) {
    const withReason = matched.find((s) => s.focus.missing);
    if (withReason) chosen = { focus: withReason.focus, why: withReason.focus.missing, len: 0 };
  }
  if (!chosen && matched.length) chosen = { focus: matched[0].focus, len: 0 };

  const shape = shapeCategory(g.wrong, g.fix);
  const ruleCat = chosen ? RULE_CATEGORY[chosen.focus.rule] : undefined;
  const generic = shape === "kelime_secimi" || shape === "fiil_cekimi";
  const category: ErrorCategory = generic ? (ruleCat ?? shape) : shape;
  const ruleId = chosen?.focus.rule ?? heuristicRule(g, category, ctx);
  const { rule, tip } = toRuleInfo(ruleId);
  const explanation = chosen?.why ? `${describe(g, wrong, fix)} ${chosen.why}` : describe(g, wrong, fix);
  return {
    error: { wrong, fix, category, explanation, turkishTip: tip, rule },
    specific: Boolean(chosen?.why),
  };
}

function multisetEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const rest = [...b];
  for (const w of a) {
    const k = rest.findIndex((x) => tokEq(w, x));
    if (k < 0) return false;
    rest.splice(k, 1);
  }
  return true;
}

function result(
  exercise: Exercise,
  o: Pick<GradeResult, "verdict" | "score" | "corrected" | "errors" | "praise" | "summary" | "notes" | "source">,
): GradeResult {
  return { natural: exercise.de[0] ?? o.corrected, focusTopic: o.errors[0]?.rule?.title ?? null, followup: null, ...o };
}

/** Accepted translations as word lists, worked out once per sentence (spoken sentences list many). */
const refCache = new WeakMap<string[], { spoken: boolean; refs: { display: string; words: string[] }[] }>();

function refsOf(exercise: Exercise, spoken: boolean) {
  const hit = refCache.get(exercise.de);
  if (hit && hit.spoken === spoken) return hit.refs;
  const refs = exercise.de.map((d) => ({ display: d, words: words(d, spoken) }));
  refCache.set(exercise.de, { spoken, refs });
  return refs;
}

export function gradeLocally(exercise: Exercise, answer: string): LocalGrade {
  const spoken = exercise.level === "GK";
  const userWords = words(answer, spoken);
  const refs = refsOf(exercise, spoken);
  const rules = exercise.ruleIds?.length ? exercise.ruleIds : (TOPIC_RULES[exercise.topicId] ?? []);

  // 1. Same words as an accepted translation → correct; trivial slips become notes.
  for (const r of refs) {
    if (r.words.length === userWords.length && r.words.every((w, i) => tokEq(userWords[i], w))) {
      const notes = trivialNotes(userWords.map((u, i) => ({ u, r: r.words[i] })), answer, r.display);
      return {
        confident: true,
        result: result(exercise, {
          verdict: "correct",
          score: 100,
          corrected: r.display,
          errors: [],
          praise: notes.length ? "Dil bilgisi tamamen doğru." : "Kusursuz!",
          summary: "Cümleyi doğru çevirdin.",
          notes,
          source: "exact",
        }),
      };
    }
  }

  // 1b. Everyday speech: only filler particles differ (mal, doch, echt …) → correct, with a note.
  if (spoken) {
    const bare = (ws: string[]) => ws.filter((w) => !PARTICLES.has(w.toLowerCase()));
    const userBare = bare(userWords);
    for (const r of refs) {
      const refBare = bare(r.words);
      if (refBare.length !== userBare.length || !refBare.every((w, i) => tokEq(userBare[i], w))) continue;
      const count = (ws: string[]) => ws.filter((w) => PARTICLES.has(w.toLowerCase())).map((w) => w.toLowerCase());
      const mine = count(userWords);
      const theirs = count(r.words);
      const quote = (ws: string[]) => [...new Set(ws)].map((w) => `"${w}"`).join(", ");
      const missing = theirs.filter((w) => !mine.includes(w));
      const extra = mine.filter((w) => !theirs.includes(w));
      const notes = [
        ...(missing.length
          ? [`Parçacık: konuşmada burada genelde ${quote(missing)} ${new Set(missing).size > 1 ? "kelimeleri" : "kelimesi"} de söylenir (${r.display}). Cümleye ton katar, olmadan da doğru.`]
          : []),
        ...(extra.length ? [`Parçacık: ${quote(extra)} cümleye konuşma tonu katar, anlamı değiştirmez; burada olmasa da olur.`] : []),
        ...trivialNotes(userBare.map((u, i) => ({ u, r: refBare[i] })), answer, r.display),
      ];
      return {
        confident: true,
        result: result(exercise, {
          verdict: "correct",
          score: 100,
          corrected: r.display,
          errors: [],
          praise: "Dil bilgisi tamamen doğru.",
          summary: "Cümleyi doğru çevirdin.",
          notes,
          source: "exact",
        }),
      };
    }
  }

  // 2. Closest accepted translation (prefer one with the same conjunctions as the answer).
  const userConj = CONJUNCTIONS.filter((c) => userWords.some((w) => w.toLowerCase() === c));
  let best = refs[0];
  let bestScore = -Infinity;
  for (const r of refs) {
    const refConj = CONJUNCTIONS.filter((c) => r.words.some((w) => w.toLowerCase() === c));
    const penalty = 0.1 * (userConj.filter((c) => !refConj.includes(c)).length + refConj.filter((c) => !userConj.includes(c)).length);
    // ties (hab / habe both listed) go to the wording closest to what the learner wrote
    const s =
      (2 * lcs(userWords, r.words)) / Math.max(1, userWords.length + r.words.length) -
      penalty +
      0.05 * charSimilarity(normalizeAnswer(answer), normalizeAnswer(r.display));
    if (s > bestScore) {
      bestScore = s;
      best = r;
    }
  }

  const spans: FocusSpan[] = [];
  for (const f of exercise.focus ?? []) {
    const span = findSpan(best.words, f.expect, spoken);
    if (span) spans.push({ focus: f, start: span[0], end: span[1] });
  }
  const ctx: Ctx = { refWords: best.words, userWords, rules, spans, spoken };
  const same = lcs(userWords, best.words);
  const score = Math.round((100 * same) / Math.max(1, userWords.length, best.words.length));

  // 3. Very different answer.
  if (score < 35) {
    const { rule, tip } = toRuleInfo(rules[0]);
    return {
      confident: false,
      result: result(exercise, {
        verdict: "incorrect",
        score,
        corrected: best.display,
        errors: [
          {
            wrong: normalizeAnswer(answer),
            fix: best.display,
            category: "anlam",
            explanation: "Cevabın beklenen çeviriden çok farklı. Doğru cümleye ve aşağıdaki kurala bak, sonra benzer cümlede tekrar dene.",
            turkishTip: tip,
            rule,
          },
        ],
        praise: null,
        summary: "Bu cümle biraz zorladı. Doğrusunu inceleyip aynı kuralla yeni bir cümle deneyelim.",
        notes: [],
        source: "local",
      }),
    };
  }

  // 4. Right words, wrong order.
  if (multisetEqual(userWords, best.words)) {
    const ruleId = rules.find((r) => ORDER_RULES.has(r)) ?? "kelime-sirasi";
    // Every order mistake the answer shows (a clause can have two: verb not last, verb not first).
    const whys: string[] = [];
    for (const f of exercise.focus ?? []) {
      for (const w of f.wrong ?? []) {
        if (ORDER_RULES.has(f.rule) && containsPhrase(userWords, w.form, spoken) && !whys.includes(w.why)) whys.push(w.why);
      }
    }
    const specific = whys.length > 0;
    const why = specific ? whys.join(" ") : (ORDER_WHY[ruleId] ?? "Kelimelerin sırası farklı olmalı.");
    const { rule, tip } = toRuleInfo(ruleId);
    return {
      confident: specific,
      result: result(exercise, {
        verdict: "incorrect",
        score: 70,
        corrected: best.display,
        errors: [
          {
            wrong: normalizeAnswer(answer),
            fix: best.display,
            category: "kelime_sirasi",
            explanation: `Kelimelerin hepsi doğru, sadece sıraları farklı. ${why}`,
            turkishTip: tip,
            rule,
          },
        ],
        praise: "Bütün kelimeleri doğru seçtin.",
        summary: "Kelimeler doğru ama sıralama hatalı.",
        notes: [],
        source: "local",
      }),
    };
  }

  // 5. Word-level mistakes, each explained.
  const { groups, same: samePairs } = groupOps(align(userWords, best.words));
  const explained = groups.map((g) => explainGroup(g, ctx));
  const errors = explained.map((e) => e.error).slice(0, 6);
  const notes = trivialNotes(samePairs, answer, best.display);

  const first = errors[0];
  const summary =
    errors.length === 1
      ? !first.wrong
        ? `Bir şey eksik: "${first.fix}".`
        : !first.fix
          ? `Cümlede fazladan "${first.wrong}" var.`
          : `Bir yerde hata var: "${first.wrong}" yerine "${first.fix}" olmalı.`
      : `${errors.length} yerde hata var. Aşağıda her birinin nedenini görebilirsin.`;
  const verdict: Verdict = errors.length === 1 && score >= 75 ? "almost" : "incorrect";

  return {
    confident: explained.length > 0 && explained.every((e) => e.specific),
    result: result(exercise, {
      verdict,
      score: Math.min(score, verdict === "almost" ? 89 : 69),
      corrected: best.display,
      errors,
      praise: same / Math.max(1, best.words.length) >= 0.6 ? "Cümlenin büyük kısmı doğru." : null,
      summary,
      notes,
      source: "local",
    }),
  };
}
