// The typing game behind "Dinle & Yaz": a line is heard, some of its words are blanked out,
// and the learner types them letter by letter. Wrong letters are refused on the spot.

export type Difficulty = "kolay" | "orta" | "zor";

/** Share of the words that become blanks */
export const BLANK_RATIO: Record<Difficulty, number> = { kolay: 0.3, orta: 0.6, zor: 1 };

export type Segment = { kind: "text"; text: string } | { kind: "word"; text: string; blank: boolean };

const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const TYPABLE = /[\p{L}\p{N}]/u;

/** Splits a line into words and the text between them (spaces, punctuation, quotes). */
export function splitLine(line: string): { kind: "text" | "word"; text: string }[] {
  const out: { kind: "text" | "word"; text: string }[] = [];
  let last = 0;
  for (const m of line.matchAll(WORD)) {
    if (m.index > last) out.push({ kind: "text", text: line.slice(last, m.index) });
    out.push({ kind: "word", text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ kind: "text", text: line.slice(last) });
  return out;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Blanks out a share of the words. The choice is stable for the same line and seed;
 * on the easier settings longer words go first, so "ich", "der" and "es" rarely become blanks.
 */
export function makeCloze(line: string, difficulty: Difficulty, seed = 0): Segment[] {
  const parts = splitLine(line);
  const words = parts.flatMap((p, i) => (p.kind === "word" ? [i] : []));
  const ratio = BLANK_RATIO[difficulty];
  const count = ratio >= 1 ? words.length : Math.min(words.length, Math.max(1, Math.round(words.length * ratio)));
  const ranked = [...words].sort((a, b) => {
    const short = (i: number) => (parts[i].text.length < 4 ? 1 : 0);
    return short(a) - short(b) || hash(`${seed}:${a}:${parts[a].text}`) - hash(`${seed}:${b}:${parts[b].text}`);
  });
  const blanks = new Set(ranked.slice(0, count));
  return parts.map((p, i) => (p.kind === "word" ? { kind: "word", text: p.text, blank: blanks.has(i) } : { kind: "text", text: p.text }));
}

/** Letters and digits are typed; apostrophes and hyphens inside a word fill themselves in. */
export function isTypable(ch: string): boolean {
  return TYPABLE.test(ch);
}

const FOLD: Record<string, string> = { ä: "a", ö: "o", ü: "u", ß: "s" };

/** Case never matters, and a plain a/o/u/s is accepted for ä/ö/ü/ß (keyboards without umlauts). */
export function acceptsChar(expected: string, typed: string): boolean {
  const e = expected.toLowerCase();
  const t = typed.toLowerCase();
  return e === t || FOLD[e] === t;
}

/** Number of letters the learner has to type in this line. */
export function typableCount(segments: Segment[]): number {
  let n = 0;
  for (const s of segments) if (s.kind === "word" && s.blank) for (const ch of s.text) if (isTypable(ch)) n++;
  return n;
}

// ---------- own songs ----------

export interface SongLine {
  text: string;
  /** Turkish meaning, written after " | " on the same line */
  tr?: string;
  /** Seconds into the media where the line starts */
  start?: number;
  /** Where it ends, when the source says so (subtitles, an empty LRC stamp) */
  end?: number;
}

const STAMP = /^\s*\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]\s*/;
const META = /^\s*\[[a-z]+:.*\]\s*$/i;
const HAS_WORD = /[\p{L}\p{N}]/u;

function stampSeconds(m: RegExpExecArray): number {
  return Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number(`0.${m[3]}`) : 0);
}

/**
 * Reads pasted lyrics: one line per line, optional LRC time stamps ("[01:02.50] text", several for a
 * repeated chorus) and an optional Turkish meaning after a vertical bar ("Ich bin hier | Buradayım").
 * A stamp with no text marks where the previous line ends.
 */
export function parseLyrics(raw: string): SongLine[] {
  const out: SongLine[] = [];
  let timed = false;
  for (const rawLine of raw.split(/\r?\n/)) {
    if (META.test(rawLine)) continue;
    let line = rawLine;
    const starts: number[] = [];
    for (let m = STAMP.exec(line); m; m = STAMP.exec(line)) {
      starts.push(stampSeconds(m));
      line = line.slice(m[0].length);
    }
    const [de, ...rest] = line.split("|");
    const text = de.replace(/\s+/g, " ").trim();
    if (!text || !HAS_WORD.test(text)) {
      // "[01:05.00]" alone: the line before it stops here
      const prev = out.at(-1);
      if (starts.length && prev?.start !== undefined && prev.end === undefined && starts[0] > prev.start) prev.end = starts[0];
      continue;
    }
    const tr = rest.join("|").trim();
    if (!starts.length) out.push({ text, ...(tr ? { tr } : {}) });
    for (const start of starts) {
      timed = true;
      out.push({ text, ...(tr ? { tr } : {}), start });
    }
  }
  return timed ? out.sort((a, b) => (a.start ?? Infinity) - (b.start ?? Infinity)) : out;
}

const CUE_TIME = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})[,.](\d{1,3})/;

function cueSeconds(s: string): number | null {
  const m = CUE_TIME.exec(s);
  if (!m) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(`0.${m[4]}`);
}

/** Subtitle text without styling, speaker dashes, sound notes ("[Musik]", "(lacht)") or music signs. */
export function cleanCueText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/\{[^}]*\}/g, "")
    .replace(/\[[^\]]*\]|\([^)]*\)/g, "")
    .replace(/[♪♫#]/g, "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-–—]\s*/, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Reads SRT or WebVTT subtitles into timed lines. */
export function parseSubtitles(raw: string): SongLine[] {
  const out: SongLine[] = [];
  for (const block of raw.replace(/^\uFEFF/, "").split(/\r?\n\s*\r?\n/)) {
    const rows = block.split(/\r?\n/);
    const at = rows.findIndex((r) => r.includes("-->"));
    if (at < 0) continue;
    const [from, to] = rows[at].split("-->");
    const start = cueSeconds(from);
    const end = cueSeconds(to);
    const text = cleanCueText(rows.slice(at + 1).join("\n"));
    if (start === null || !HAS_WORD.test(text)) continue;
    out.push({ text, start, ...(end !== null && end > start ? { end } : {}) });
  }
  return out.sort((a, b) => a.start! - b.start!);
}

function stamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `[${String(m).padStart(2, "0")}:${s.toFixed(2).padStart(5, "0")}]`;
}

/** The inverse of parseLyrics, so synced lyrics can be copied and kept elsewhere. */
export function formatLyrics(lines: SongLine[]): string {
  const out: string[] = [];
  lines.forEach((l, i) => {
    out.push(`${l.start !== undefined ? stamp(l.start) + " " : ""}${l.text}${l.tr ? ` | ${l.tr}` : ""}`);
    const next = lines[i + 1]?.start;
    if (l.end !== undefined && (next === undefined || next > l.end)) out.push(stamp(l.end));
  });
  return out.join("\n");
}

/** A line never holds the stage longer than this, even before a long instrumental. */
const MAX_LINE_SECONDS = 12;

/** Where a line's clip ends: its own end, else the next line's start (capped), or a few seconds later for the last one. */
export function lineEnd(lines: SongLine[], index: number): number | undefined {
  const line = lines[index];
  if (line?.start === undefined) return undefined;
  if (line.end !== undefined) return line.end;
  const next = lines.slice(index + 1).find((l) => l.start !== undefined && l.start > line.start!)?.start;
  return Math.min(next ?? line.start + 6, line.start + MAX_LINE_SECONDS);
}

/** Accepts a YouTube link (watch, youtu.be, shorts, embed, music) or a bare 11-character id. */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v");
    const m = /^\/(?:shorts|embed|live|v)\/([\w-]{11})/.exec(url.pathname);
    if (!id && m) id = m[1];
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}
