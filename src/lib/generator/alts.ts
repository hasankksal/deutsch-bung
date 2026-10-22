// Compact notation for the many ways one sentence can be said, so long spoken sentences can list
// all their accepted translations: {a|b} picks one alternative, [x] is optional (with x first),
// [a|b] is an optional choice. Groups nest: "{Hättest du mir das [früher] gesagt|Wenn du …}, …"

type Node = string | { alt: Node[][]; opt?: boolean };

function parse(src: string): Node[] {
  let i = 0;
  function seq(stops: string): Node[] {
    const out: Node[] = [];
    let text = "";
    const flush = () => {
      if (text) out.push(text);
      text = "";
    };
    while (i < src.length && !stops.includes(src[i])) {
      const c = src[i];
      if (c === "{" || c === "[") {
        flush();
        i++;
        const close = c === "{" ? "}" : "]";
        const alt: Node[][] = [seq("|" + close)];
        while (src[i] === "|") {
          i++;
          alt.push(seq("|" + close));
        }
        if (src[i++] !== close) throw new Error(`unclosed ${c} in "${src}"`);
        out.push(c === "{" ? { alt } : { alt, opt: true });
      } else {
        text += c;
        i++;
      }
    }
    flush();
    return out;
  }
  const nodes = seq("");
  if (i < src.length) throw new Error(`unexpected "${src[i]}" in "${src}"`);
  return nodes;
}

function expandSeq(nodes: Node[], cap: number): string[] {
  let acc = [""];
  for (const node of nodes) {
    const parts = typeof node === "string" ? [node] : [...node.alt.flatMap((a) => expandSeq(a, cap)), ...(node.opt ? [""] : [])];
    const next: string[] = [];
    for (const a of acc) {
      for (const p of parts) {
        next.push(a + p);
        if (next.length >= cap) break;
      }
      if (next.length >= cap) break;
    }
    acc = next;
  }
  return acc;
}

function tidy(s: string): string {
  const t = s
    .replace(/\s+/g, " ")
    .replace(/\s+([,.?!])/g, "$1")
    .replace(/,+/g, ",")
    .replace(/^[\s,]+/, "")
    .trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

/** All sentences a pattern stands for, the first choices first. */
export function expand(pattern: string, cap = 400): string[] {
  return [...new Set(expandSeq(parse(pattern), cap).map(tidy))];
}

/** Sentences of several patterns, without duplicates. */
export function say(...patterns: string[]): string[] {
  return [...new Set(patterns.flatMap((p) => expand(p)))];
}
