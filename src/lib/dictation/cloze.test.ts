import { describe, expect, it } from "vitest";
import {
  acceptsChar,
  cleanCueText,
  formatLyrics,
  lineEnd,
  makeCloze,
  parseLyrics,
  parseSubtitles,
  parseYouTubeId,
  splitLine,
  typableCount,
} from "./cloze";
import { SCENES } from "./scenes";

describe("splitLine", () => {
  it("keeps contractions and hyphenated words whole", () => {
    const words = splitLine("Dann hat's halt jemand geklaut, U-Bahn!").filter((p) => p.kind === "word");
    expect(words.map((w) => w.text)).toEqual(["Dann", "hat's", "halt", "jemand", "geklaut", "U-Bahn"]);
  });

  it("joins back to the original line", () => {
    const line = "„Mein Sohn, was birgst du so bang dein Gesicht?“ –";
    expect(splitLine(line).map((p) => p.text).join("")).toBe(line);
  });
});

describe("makeCloze", () => {
  const line = "Eigentlich hätte ich schon längst aussteigen müssen.";
  const blanks = (d: "kolay" | "orta" | "zor", seed = 0) =>
    makeCloze(line, d, seed).filter((s) => s.kind === "word" && s.blank).map((s) => s.text);

  it("blanks every word on zor", () => {
    expect(blanks("zor")).toHaveLength(7);
  });

  it("blanks fewer words on easier settings, preferring long ones", () => {
    expect(blanks("kolay")).toHaveLength(2);
    expect(blanks("orta")).toHaveLength(4);
    expect(blanks("kolay")).not.toContain("ich");
  });

  it("is stable for a seed and changes with another", () => {
    expect(blanks("orta", 1)).toEqual(blanks("orta", 1));
    const seen = new Set([0, 1, 2, 3, 4, 5].map((s) => blanks("orta", s).join()));
    expect(seen.size).toBeGreaterThan(1);
  });

  it("always leaves something to type in every built-in line", () => {
    for (const scene of SCENES)
      for (const l of scene.lines) expect(typableCount(makeCloze(l.de, "kolay")), l.de).toBeGreaterThan(0);
  });
});

describe("acceptsChar", () => {
  it("ignores case and accepts plain vowels for umlauts", () => {
    expect(acceptsChar("W", "w")).toBe(true);
    expect(acceptsChar("ä", "a")).toBe(true);
    expect(acceptsChar("Ü", "u")).toBe(true);
    expect(acceptsChar("ß", "s")).toBe(true);
    expect(acceptsChar("a", "ä")).toBe(false);
    expect(acceptsChar("e", "a")).toBe(false);
  });
});

describe("parseLyrics", () => {
  it("reads LRC stamps, meanings and skips tags and empty lines", () => {
    const lines = parseLyrics("[ar: Someone]\n[00:12.5] Ich bin hier | Buradayım\n\n[01:03] Du bist weg\nOhne Zeit");
    expect(lines).toEqual([
      { text: "Ich bin hier", tr: "Buradayım", start: 12.5 },
      { text: "Du bist weg", start: 63 },
      { text: "Ohne Zeit" },
    ]);
  });

  it("round-trips through formatLyrics", () => {
    const lines = parseLyrics("[00:05.25] Eins | bir\n[00:09.00] Zwei");
    expect(parseLyrics(formatLyrics(lines))).toEqual(lines);
  });

  it("lets an empty stamp end the line before it and repeats choruses", () => {
    const lines = parseLyrics("[00:05] Eins\n[00:08]\n[00:10][00:30] Refrain\n[00:20] Zwei");
    expect(lines).toEqual([
      { text: "Eins", start: 5, end: 8 },
      { text: "Refrain", start: 10 },
      { text: "Zwei", start: 20 },
      { text: "Refrain", start: 30 },
    ]);
    expect(parseLyrics(formatLyrics(lines))).toEqual(lines);
  });

  it("caps a line before a long gap", () => {
    expect(lineEnd(parseLyrics("[00:05] Eins\n[01:30] Zwei"), 0)).toBe(17);
  });

  it("ends a clip at the next line's start", () => {
    const lines = parseLyrics("[00:05] Eins\n[00:09] Zwei\nDrei");
    expect(lineEnd(lines, 0)).toBe(9);
    expect(lineEnd(lines, 1)).toBe(15);
    expect(lineEnd(lines, 2)).toBeUndefined();
  });
});

describe("parseYouTubeId", () => {
  it("understands the usual link shapes", () => {
    const id = "dQw4w9WgXcQ";
    for (const s of [
      id,
      `https://www.youtube.com/watch?v=${id}&t=10s`,
      `youtube.com/watch?v=${id}`,
      `https://youtu.be/${id}?si=abc`,
      `https://www.youtube.com/shorts/${id}`,
      `https://music.youtube.com/watch?v=${id}`,
      `https://www.youtube-nocookie.com/embed/${id}`,
    ])
      expect(parseYouTubeId(s), s).toBe(id);
  });

  it("rejects other sites and junk", () => {
    expect(parseYouTubeId("https://vimeo.com/123456")).toBeNull();
    expect(parseYouTubeId("hallo")).toBeNull();
  });
});

describe("parseSubtitles", () => {
  it("reads SRT cues and cleans them", () => {
    const srt = "1\n00:00:01,500 --> 00:00:03,000\n<i>- Wo warst du?</i>\n- Draußen.\n\n2\n00:00:04,000 --> 00:00:05,000\n[Musik]\n\n3\n01:02:03,250 --> 01:02:04,000\n(lacht) Na klar!\n";
    expect(parseSubtitles(srt)).toEqual([
      { text: "Wo warst du? Draußen.", start: 1.5, end: 3 },
      { text: "Na klar!", start: 3723.25, end: 3724 },
    ]);
  });

  it("reads WebVTT with short times and cue settings", () => {
    const vtt = "WEBVTT\n\n00:10.000 --> 00:12.500 align:start\nHallo zusammen\n";
    expect(parseSubtitles(vtt)).toEqual([{ text: "Hallo zusammen", start: 10, end: 12.5 }]);
  });

  it("drops styling tags and music signs", () => {
    expect(cleanCueText("♪ <b>Ich</b> {\\an8}geh ♪")).toBe("Ich geh");
  });
});
