// Turkish morphology for the sentence generator: vowel harmony and the verb forms the templates use.
import { pi, type Person } from "./de";

const VOWELS = "aeıioöuü";
const VOICELESS = "çfhkpsşt";
const H4: Record<string, string> = { a: "ı", ı: "ı", e: "i", i: "i", o: "u", u: "u", ö: "ü", ü: "ü" };

export function lastVowel(s: string): string {
  for (let i = s.length - 1; i >= 0; i--) if (VOWELS.includes(s[i])) return s[i];
  return "e";
}
/** Four-way harmony: ı / i / u / ü */
export const h4 = (s: string) => H4[lastVowel(s)];
/** Two-way harmony: a / e */
export const h2 = (s: string) => ("aıou".includes(lastVowel(s)) ? "a" : "e");
const endsVowel = (s: string) => VOWELS.includes(s[s.length - 1]);
const dT = (s: string) => (VOICELESS.includes(s[s.length - 1]) ? "t" : "d");

export interface TrVerb {
  /** Verb stem, multi-word allowed: "git", "yardım et", "oku" */
  stem: string;
  /** Stem before a vowel when it softens: git → gid, et → ed */
  soft?: string;
  /** Third person aorist when the rule gives the wrong form (kaybet → kaybeder) */
  aor?: string;
}

export const tv = (stem: string, soft?: string, aor?: string): TrVerb => ({ stem, soft, ...(aor ? { aor } : {}) });

function special(stem: string): string | null {
  if (stem === "ye" || stem.endsWith(" ye")) return stem.slice(0, -2) + "yi";
  if (stem === "de" || stem.endsWith(" de")) return stem.slice(0, -2) + "di";
  return null;
}

const YOR_END = ["um", "sun", "", "uz", "sunuz", "lar"];

/** Present continuous: gidiyorum, okumuyorsun… */
export function present(v: TrVerb, p: Person, neg = false): string {
  let base: string;
  if (neg) base = v.stem + "m" + h4(v.stem) + "yor";
  else {
    const sp = special(v.stem);
    if (sp) base = sp + "yor";
    else if (endsVowel(v.stem)) {
      const cut = v.stem.slice(0, -1);
      base = cut + h4(cut) + "yor";
    } else base = (v.soft ?? v.stem) + h4(v.stem) + "yor";
  }
  return base + YOR_END[pi(p)];
}

/** Present continuous question: geliyor musun, geliyorlar mı */
export function presentQ(v: TrVerb, p: Person): string {
  const base = present(v, "3sg");
  if (p === "3pl") return base + "lar mı";
  return base + " " + ["muyum", "musun", "mu", "muyuz", "musunuz"][pi(p)];
}

function pastEndings(vowel: string): string[] {
  return ["m", "n", "", "k", "n" + vowel + "z", "l" + (vowel === "i" || vowel === "ü" ? "e" : "a") + "r"];
}

/** Simple past: gittim, okumadın… */
export function past(v: TrVerb, p: Person, neg = false): string {
  const s = neg ? v.stem + "m" + h2(v.stem) : v.stem;
  const vowel = h4(s);
  return s + dT(s) + vowel + pastEndings(vowel)[pi(p)];
}

/** Future: gideceğim, okuyacaksın… */
export function future(v: TrVerb, p: Person): string {
  const s = special(v.stem) ?? v.soft ?? v.stem;
  const a = h2(s);
  const i = a === "e" ? "i" : "ı";
  const core = s + (endsVowel(s) ? "y" : "") + a + "c" + a;
  return core + ["ğ" + i + "m", "ks" + i + "n", "k", "ğ" + i + "z", "ks" + i + "n" + i + "z", "kl" + a + "r"][pi(p)];
}

/** Necessity: gitmeliyim, okumalısın… */
export function necessity(v: TrVerb, p: Person): string {
  const a = h2(v.stem);
  const i = a === "e" ? "i" : "ı";
  const base = v.stem + "m" + a + "l" + i;
  return base + ["y" + i + "m", "s" + i + "n", "", "y" + i + "z", "s" + i + "n" + i + "z", "l" + a + "r"][pi(p)];
}

/** Ability (aorist): gidebilirim, okuyabilirsin… */
export function ability(v: TrVerb, p: Person): string {
  const s = special(v.stem) ?? v.soft ?? v.stem;
  const base = s + (endsVowel(s) ? "y" : "") + h2(s) + "bilir";
  return base + ["im", "sin", "", "iz", "siniz", "ler"][pi(p)];
}

/** Could not (past): gelemedim, okuyamadın… */
export function inabilityPast(v: TrVerb, p: Person): string {
  const s = special(v.stem) ?? v.soft ?? v.stem;
  const a = h2(s);
  const vowel = a === "e" ? "i" : "ı";
  return s + (endsVowel(s) ? "y" : "") + a + "m" + a + "d" + vowel + pastEndings(vowel)[pi(p)];
}

/** Cannot (present): gelemiyorum, okuyamıyorsun… */
export function inabilityPresent(v: TrVerb, p: Person): string {
  const s = special(v.stem) ?? v.soft ?? v.stem;
  const a = h2(s);
  return s + (endsVowel(s) ? "y" : "") + a + "m" + (a === "e" ? "i" : "ı") + "yor" + YOR_END[pi(p)];
}

/** Infinitive: gitmek, okumak */
export function infinitive(v: TrVerb): string {
  return v.stem + "m" + h2(v.stem) + "k";
}

/** Copula: yorgunum, hastasın, mutluyuz… */
export function copula(word: string, p: Person): string {
  const i = h4(word);
  const y = endsVowel(word) ? "y" : "";
  return word + [y + i + "m", "s" + i + "n", "", y + i + "z", "s" + i + "n" + i + "z", "l" + h2(word) + "r"][pi(p)];
}

/** Past copula: yorgundum, hastaydın… */
export function copulaPast(word: string, p: Person): string {
  const y = endsVowel(word) ? "y" : "";
  const vowel = h4(word);
  const d = y ? "d" : dT(word);
  return word + y + d + vowel + pastEndings(vowel)[pi(p)];
}

export function trCapitalize(s: string): string {
  return s ? s[0].toLocaleUpperCase("tr-TR") + s.slice(1) : s;
}

export function trSentence(parts: (string | false | null | undefined)[], end = "."): string {
  const text = parts
    .filter((p): p is string => Boolean(p))
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
  return trCapitalize(text) + end;
}

// ---------- forms for complex sentences ----------

/** Monosyllabic stems that take -Ir in the aorist (gelir, alır); the others take -Ar (gider, yapar). */
const AORIST_IR = new Set(["al", "bil", "bul", "dur", "gel", "gör", "kal", "ol", "öl", "san", "var", "ver", "vur"]);
const vowelCount = (w: string) => [...w].filter((c) => VOWELS.includes(c)).length;
const softOf = (v: TrVerb) => v.soft ?? v.stem;
/** Stem before a vowel-initial suffix: gid-, ed-, and yi- / di- for ye / de */
const beforeVowel = (v: TrVerb) => special(v.stem) ?? softOf(v);
const negStem = (v: TrVerb) => v.stem + "m" + h2(v.stem);
const isThird = (p: Person) => p === "3sg" || p === "3pl";

/** Aorist, third person singular: gider, okur, gelir, yapar, çalışır */
export function aorist3(v: TrVerb): string {
  if (v.aor) return v.aor;
  if (endsVowel(v.stem)) return v.stem + "r";
  const last = v.stem.slice(v.stem.lastIndexOf(" ") + 1);
  const vowel = vowelCount(last) === 1 && !AORIST_IR.has(last) ? h2(v.stem) : h4(v.stem);
  return softOf(v) + vowel + "r";
}

/** Aorist: giderim, okursun, gelir… (negative: gitmem, gitmezsin, gitmez…) */
export function aorist(v: TrVerb, p: Person, neg = false): string {
  if (neg) {
    const m = negStem(v);
    const i = h4(m);
    return [m + "m", m + "zs" + i + "n", m + "z", m + "y" + i + "z", m + "zs" + i + "n" + i + "z", m + "zl" + h2(m) + "r"][pi(p)];
  }
  const a = aorist3(v);
  const i = h4(a);
  return a + [i + "m", "s" + i + "n", "", i + "z", "s" + i + "n" + i + "z", "l" + h2(a) + "r"][pi(p)];
}

/** Past habitual / unreal result: giderdim, okurdun, giderlerdi */
export function aoristPast(v: TrVerb, p: Person): string {
  const a = aorist3(v);
  if (p === "3pl") {
    const pl = a + "l" + h2(a) + "r";
    return pl + "d" + h4(pl);
  }
  const i = h4(a);
  return a + "d" + i + ["m", "n", "", "k", "n" + i + "z"][pi(p)];
}

/** Past continuous: gidiyordum, okumuyordun, gidiyorlardı */
export function pastCont(v: TrVerb, p: Person, neg = false): string {
  if (p === "3pl") return present(v, "3pl", neg) + "dı";
  return present(v, "3sg", neg) + "du" + ["m", "n", "", "k", "nuz"][pi(p)];
}

function misBase(v: TrVerb, neg: boolean): string {
  const s = neg ? negStem(v) : v.stem;
  return s + "m" + h4(s) + "ş";
}

/** Reported / surprised past: gitmişim, aramışsın, gitmiş… */
export function evidential(v: TrVerb, p: Person, neg = false): string {
  const b = misBase(v, neg);
  const i = h4(b);
  return b + [i + "m", "s" + i + "n", "", i + "z", "s" + i + "n" + i + "z", "l" + h2(b) + "r"][pi(p)];
}

/** Past perfect: gitmiştim, okumuştun, gitmişlerdi */
export function pastPerfect(v: TrVerb, p: Person, neg = false): string {
  const b = misBase(v, neg);
  if (p === "3pl") {
    const pl = b + "l" + h2(b) + "r";
    return pl + "d" + h4(pl);
  }
  const i = h4(b);
  return b + "t" + i + ["m", "n", "", "k", "n" + i + "z"][pi(p)];
}

/** Conditional: gitsem, okusan, gitse… (used in "ne kadar … -sa da") */
export function cond(v: TrVerb, p: Person, neg = false): string {
  const s = neg ? negStem(v) : v.stem;
  const b = s + "s" + h2(s);
  return b + ["m", "n", "", "k", "n" + h4(b) + "z", "l" + h2(b) + "r"][pi(p)];
}

/** Unreal condition: gitseydim, olsaydın, gitselerdi (negative: gitmeseydim) */
export function condPast(v: TrVerb, p: Person, neg = false): string {
  const s = neg ? negStem(v) : v.stem;
  const a = h2(s);
  if (p === "3pl") {
    const pl = s + "s" + a + "l" + a + "r";
    return pl + "d" + h4(pl);
  }
  const b = s + "s" + a + "yd";
  const i = h4(s + "s" + a);
  return b + i + ["m", "n", "", "k", "n" + i + "z"][pi(p)];
}

/** Real condition: gelirsem, olursa, gelmezsen */
export function aoristCond(v: TrVerb, p: Person, neg = false): string {
  const a = neg ? negStem(v) + "z" : aorist3(v);
  if (p === "3pl") {
    const pl = a + "l" + h2(a) + "r";
    return pl + "s" + h2(pl);
  }
  const b = a + "s" + h2(a);
  return b + ["m", "n", "", "k", "n" + h4(b) + "z"][pi(p)];
}

/** Past necessity (regret): gitmeliydim, aramalıydın */
export function necessityPast(v: TrVerb, p: Person): string {
  const base = necessity(v, "3sg");
  const i = h4(base);
  return base + "yd" + i + pastEndings(i)[pi(p)];
}

/** Ability question: arayabilir misin, gelebilirler mi */
export function abilityQ(v: TrVerb, p: Person): string {
  if (p === "3pl") return ability(v, "3pl") + " mi";
  return ability(v, "3sg") + " " + ["miyim", "misin", "mi", "miyiz", "misiniz"][pi(p)];
}

/** Past question: gittin mi, aradılar mı */
export function pastQ(v: TrVerb, p: Person): string {
  const f = past(v, p);
  return f + " m" + h4(f);
}

/** Future question: gelecek misin, gelecekler mi */
export function futureQ(v: TrVerb, p: Person): string {
  if (p === "3pl") {
    const f = future(v, "3pl");
    return f + " m" + h4(f);
  }
  const core = future(v, "3sg");
  const i = h4(core);
  return core + " m" + i + ["y" + i + "m", "s" + i + "n", "", "y" + i + "z", "s" + i + "n" + i + "z"][pi(p)];
}

/** Verbal noun: gitme, okuma (negative: gitmeme) */
export function verbNoun(v: TrVerb, neg = false): string {
  const s = neg ? negStem(v) : v.stem;
  return s + "m" + h2(s);
}

/** Possessive: annem, annesi, kitabım, kitapları; `soft` is the stem before a vowel (kitap → kitab). */
export function poss(word: string, p: Person, soft?: string): string {
  const i = h4(word);
  const a = h2(word);
  const lari = "l" + a + "r" + h4(a);
  if (endsVowel(word)) return word + ["m", "n", "s" + i, "m" + i + "z", "n" + i + "z", lari][pi(p)];
  const w = soft ?? word;
  return [w + i + "m", w + i + "n", w + i, w + i + "m" + i + "z", w + i + "n" + i + "z", word + lari][pi(p)];
}

export type TrCase = "nom" | "acc" | "dat" | "loc" | "abl" | "ins";

/**
 * Case ending. `third`: the word ends in a third person possessive (annesi → annesini, annesine).
 * Proper names get an apostrophe (Berlin'e, Ali'yi).
 */
export function kase(word: string, c: TrCase, third = false, soft?: string): string {
  if (c === "nom") return word;
  const proper = /^[A-ZÇĞİÖŞÜ]/.test(word) && !word.includes(" ");
  const ap = proper ? "'" : "";
  const vowelEnd = endsVowel(word);
  const stem = !vowelEnd && !third && soft && !proper ? soft : word;
  switch (c) {
    case "acc":
      return stem + ap + (third ? "n" : vowelEnd ? "y" : "") + h4(word);
    case "dat":
      return stem + ap + (third ? "n" : vowelEnd ? "y" : "") + h2(word);
    case "loc":
      return word + ap + (third ? "nd" : dT(word)) + h2(word);
    case "abl":
      return word + ap + (third ? "nd" : dT(word)) + h2(word) + "n";
    case "ins":
      return word + ap + (vowelEnd ? "y" : "") + "l" + h2(word);
  }
}

/** Possessed noun with a case: annemi, annesine, kitabını */
export function possCase(word: string, p: Person, c: TrCase, soft?: string): string {
  return kase(poss(word, p, soft), c, isThird(p));
}

/** -DIK participle with possessive: gittiğim, okuduğun, geldikleri (negative: gitmediğim) */
export function dik(v: TrVerb, p: Person, neg = false): string {
  const s = neg ? negStem(v) : v.stem;
  const base = s + dT(s) + h4(s);
  if (p === "3pl") {
    const pl = base + "kl" + h2(base) + "r";
    return pl + h4(pl);
  }
  const i = h4(base);
  return base + "ğ" + i + ["m", "n", "", "m" + i + "z", "n" + i + "z"][pi(p)];
}

/** -AcAK participle with possessive: gideceğim, okuyacağı, gidecekleri */
export function futPart(v: TrVerb, p: Person): string {
  const s = beforeVowel(v);
  const a = h2(s);
  const core = s + (endsVowel(s) ? "y" : "") + a + "c" + a;
  const i = h4(core);
  if (p === "3pl") return core + "kl" + a + "r" + i;
  return core + "ğ" + i + ["m", "n", "", "m" + i + "z", "n" + i + "z"][pi(p)];
}

/** Case ending after a participle with possessive (gittiğimi, gittiğinde, gittiklerinden). */
export function partCase(form: string, p: Person, c: TrCase): string {
  return kase(form, c, isThird(p));
}

/** gitmeden, okumadan (+ önce) */
export function madan(v: TrVerb): string {
  return v.stem + "m" + h2(v.stem) + "d" + h2(v.stem) + "n";
}

/** gittikten, okuduktan (+ sonra) */
export function diktan(v: TrVerb): string {
  const b = v.stem + dT(v.stem) + h4(v.stem);
  return b + "kt" + h2(b) + "n";
}

/** giderken, okurken (negative: gitmezken) */
export function ken(v: TrVerb, neg = false): string {
  return (neg ? negStem(v) + "z" : aorist3(v)) + "ken";
}

/** giderek, okuyarak */
export function arak(v: TrVerb): string {
  const s = beforeVowel(v);
  const a = h2(s);
  return s + (endsVowel(s) ? "y" : "") + a + "r" + a + "k";
}

/** gidince, okuyunca */
export function ince(v: TrVerb): string {
  const s = beforeVowel(v);
  return s + (endsVowel(s) ? "y" : "") + h4(s) + "nc" + h2(s);
}

/** gidip, okuyup */
export function ip(v: TrVerb): string {
  const s = beforeVowel(v);
  return s + (endsVowel(s) ? "y" : "") + h4(s) + "p";
}

/** gidene, okuyana (+ kadar) */
export function ene(v: TrVerb): string {
  const s = beforeVowel(v);
  const a = h2(s);
  return s + (endsVowel(s) ? "y" : "") + a + "n" + a;
}

/** Present participle: oynayan, bekleyen, gülen */
export function presPart(v: TrVerb): string {
  return ene(v).slice(0, -1);
}

/** Friendly push ("doch mal"): arasana, gelsene; plural arasanıza */
export function sana(v: TrVerb, plural = false): string {
  const a = h2(v.stem);
  const b = v.stem + "s" + a + "n";
  return plural ? b + h4(b) + "z" + a : b + a;
}

/** Imperative: git / gidin, oku / okuyun */
export function imperative(v: TrVerb, plural = false): string {
  if (!plural) return v.stem;
  const s = beforeVowel(v);
  return s + (endsVowel(s) ? "y" : "") + h4(s) + "n";
}

// ---------- everyday speech ----------

/** Let's …: gidelim, okuyalım, yardım edelim */
export function optativeWe(v: TrVerb): string {
  const s = beforeVowel(v);
  const base = s + (endsVowel(s) ? "y" : "") + h2(s) + "l";
  return base + h4(base) + "m";
}

/** Let me …: alayım, gideyim */
export function optativeI(v: TrVerb): string {
  const s = beforeVowel(v);
  const base = s + (endsVowel(s) ? "y" : "") + h2(s) + "y";
  return base + h4(base) + "m";
}

/** Shall we …?: gidelim mi, okuyalım mı */
export function optativeWeQ(v: TrVerb): string {
  const f = optativeWe(v);
  return `${f} m${h4(f)}`;
}

/** Everyday request in the aorist: açar mısın, yardım eder misiniz */
export function aoristQ(v: TrVerb, p: Person): string {
  const a = aorist3(v);
  const i = h4(a);
  if (p === "3pl") return `${a}l${h2(a)}r m${h4(a + "l" + h2(a) + "r")}`;
  return `${a} m${i}${["y" + i + "m", "s" + i + "n", "", "y" + i + "z", "s" + i + "n" + i + "z"][pi(p)]}`;
}

/** Feeling like doing it (colloquial -esi): gidesim (yok), çalışası (yok), kalkasımız (yok) */
export function desire(v: TrVerb, p: Person): string {
  const s = beforeVowel(v);
  const base = s + (endsVowel(s) ? "y" : "") + h2(s) + "s" + h4(s + h2(s));
  return base + ["m", "n", "", "m" + h4(base) + "z", "n" + h4(base) + "z", ""][pi(p)];
}

// ---------- advanced spoken sentences ----------

/** The last word of a compound verb (yardım et → et): the part "-ip -mez" forms repeat. */
function lastWord(v: TrVerb): TrVerb {
  const cut = (s: string) => s.slice(s.lastIndexOf(" ") + 1);
  return { stem: cut(v.stem), ...(v.soft ? { soft: cut(v.soft) } : {}), ...(v.aor ? { aor: cut(v.aor) } : {}) };
}

/** The "cannot" stem as a verb of its own: geleme-, okuyama-, yardım edeme- (gelemeyeceğim) */
export function unable(v: TrVerb): TrVerb {
  const s = beforeVowel(v);
  const a = h2(s);
  return { stem: s + (endsVowel(s) ? "y" : "") + a + "m" + a };
}

/** As soon as: gelir gelmez, varır varmaz, yardım eder etmez */
export function irmez(v: TrVerb): string {
  return `${aorist3(v)} ${negStem(lastWord(v))}z`;
}

/**
 * Whether or not, for indirect questions: gidip gitmediğini (past/now), gidip gitmeyeceğini
 * (future), gelip gelemeyeceğini (ability); with another case: gelip gelemeyeceğine (bağlı).
 */
export function whether(v: TrVerb, p: Person, kind: "past" | "fut" | "able", c: TrCase = "acc"): string {
  const last = lastWord(v);
  const second = kind === "past" ? dik(last, p, true) : futPart(kind === "fut" ? { stem: negStem(last) } : unable(last), p);
  return `${ip(v)} ${partCase(second, p, c)}`;
}

/** Real condition with ability: alabilirsen, gelebilirse, alabilirlerse */
export function abilityCond(v: TrVerb, p: Person): string {
  const base = ability(v, "3sg");
  const e = h2(base);
  if (p === "3pl") return `${base}l${e}rs${e}`;
  const b = base + "s" + e;
  return b + ["m", "n", "", "k", "n" + h4(b) + "z"][pi(p)];
}

/** Present conditional: izliyorsan, kahvaltı etmiyorsa, izliyorlarsa */
export function presCond(v: TrVerb, p: Person, neg = false): string {
  if (p === "3pl") return present(v, "3pl", neg) + "sa";
  return present(v, "3sg", neg) + "sa" + ["m", "n", "", "k", "nız"][pi(p)];
}

// ---------- C1 sentences ----------

/** Unless / as long as not: almadıkça, gelmedikçe, yardım etmedikçe */
export function madikca(v: TrVerb): string {
  const m = negStem(v);
  const b = m + dT(m) + h4(m);
  return b + "kç" + h2(b);
}

/** Could have (but did not): arayabilirdin, gelebilirdi, arayabilirlerdi */
export function abilityPast(v: TrVerb, p: Person): string {
  const base = ability(v, "3sg");
  if (p === "3pl") return `${base}l${h2(base)}rd${h4(base + "l" + h2(base) + "r")}`;
  const i = h4(base);
  return base + "d" + i + ["m", "n", "", "k", "n" + i + "z"][pi(p)];
}

/** "As if" with a present verb: biliyormuş, biliyormuşsun, biliyorlarmış */
export function presentEvid(v: TrVerb, p: Person, neg = false): string {
  if (p === "3pl") return present(v, "3pl", neg) + "mış";
  return present(v, "3sg", neg) + "muş" + ["um", "sun", "", "uz", "sunuz"][pi(p)];
}

/** "As if" with a noun or adjective: patronmuş, hastaymışsın, zenginmişiz */
export function copulaEvid(word: string, p: Person): string {
  const i = h4(word);
  const b = word + (endsVowel(word) ? "y" : "") + "m" + i + "ş";
  return b + [i + "m", "s" + i + "n", "", i + "z", "s" + i + "n" + i + "z", "l" + h2(word) + "r"][pi(p)];
}
