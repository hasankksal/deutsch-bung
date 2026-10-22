/** Canonical form used to compare answers: unified quotes/spaces, no sentence-final punctuation. */
export function normalizeAnswer(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[‘’‚′`´]/g, "'")
    .replace(/[“”„«»]/g, '"')
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim()
    .replace(/[.!?…]+$/u, "")
    .trim();
}

export function stripCommas(s: string): string {
  return s.replace(/,/g, "").replace(/\s+/g, " ").trim();
}

/** Words (letters/digits, with inner apostrophes or hyphens) and single punctuation marks. */
export function tokenize(s: string): string[] {
  return s.match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*|[^\s\p{L}\p{N}]/gu) ?? [];
}

export function joinTokens(tokens: string[]): string {
  let out = "";
  for (const t of tokens) {
    if (!out) out = t;
    else if (/^[,.!?;:)\]]$/.test(t)) out += t;
    else out += " " + t;
  }
  return out;
}

/** Lowercase and fold umlauts/ß plus their ASCII spellings, to spot pure spelling slips. */
export function foldSpelling(s: string): string {
  return s
    .toLowerCase()
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss");
}

export type DiffOp = { type: "same" | "del" | "add"; text: string };

type Eq = (a: string, b: string) => boolean;
const strictEq: Eq = (a, b) => a === b;
export const caseInsensitiveEq: Eq = (a, b) => a.toLowerCase() === b.toLowerCase();

function lcsTable(a: string[], b: string[], eq: Eq): number[][] {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  return dp;
}

export function lcsLength(a: string[], b: string[], eq: Eq = strictEq): number {
  return lcsTable(a, b, eq)[0][0];
}

/** Token diff from `a` (learner) to `b` (reference). Deletions come before additions in a changed run. */
export function diffTokens(a: string[], b: string[], eq: Eq = strictEq): DiffOp[] {
  const dp = lcsTable(a, b, eq);
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (eq(a[i], b[j])) {
      ops.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "del", text: a[i++] });
    } else {
      ops.push({ type: "add", text: b[j++] });
    }
  }
  while (i < a.length) ops.push({ type: "del", text: a[i++] });
  while (j < b.length) ops.push({ type: "add", text: b[j++] });
  return ops;
}
