// Slot machine reels for a sentence: each word gets its own reel of filler words that spins
// and stops on the real word. Later reels spin longer, so the words land one after another.

/** Height of one reel line in em (the .reel CSS uses the same value). */
export const REEL_LINE = 1.25;
/** Part of a reel's spin after which the word is in place; the rest is the small bounce back. */
export const REEL_LAND = 0.84;

const SYMBOLS = ["7", "★", "BAR", "♦", "♣"];

const FILLERS = (
  "ev kitap yarın güzel kahve okul arkadaş bugün çok araba deniz istiyorum gidiyoruz annem sabah akşam " +
  "şehir mutlu hızlı yeni küçük büyük çay ekmek kedi köpek tren uçak doktor hava yağmur güneş pazar iş " +
  "müzik film park bahçe kapı telefon çanta elma zaman hafta gece şimdi belki bazen birlikte erken geç " +
  "sıcak soğuk tatlı yorgun dün sinema mutfak pencere öğretmen kardeşim babam oyun sokak dağ orman"
).split(" ");

export interface Reel {
  word: string;
  /** Fillers that pass by before the word */
  strip: string[];
  /** Filler right after the word, seen during the bounce */
  after: string;
  /** Spin time in ms */
  duration: number;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The reels for a sentence. The fillers are seeded, so the same seed always gives the same reels. */
export function buildReels(text: string, seed: string): Reel[] {
  const words = text.split(/\s+/).filter(Boolean);
  const rand = mulberry32(hash(seed));
  const pick = (avoid: string) => {
    const pool = rand() < 0.15 ? SYMBOLS : FILLERS;
    const w = pool[Math.floor(rand() * pool.length)];
    return w === avoid ? SYMBOLS[0] : w;
  };
  const step = words.length > 1 ? Math.min(120, 850 / (words.length - 1)) : 0;
  return words.map((word, i) => {
    const duration = Math.round(760 + i * step);
    const strip: string[] = [];
    for (let k = Math.round(duration / 60); k > 0; k--) strip.push(pick(strip[strip.length - 1] ?? word));
    return { word, strip, after: pick(word), duration };
  });
}
