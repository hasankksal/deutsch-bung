// Time-stamped lyrics from LRCLIB (lrclib.net), a free, open lyrics database. The request goes
// straight from the visitor's browser to LRCLIB when they search; this site keeps no lyrics.

const API = "https://lrclib.net/api/search";

export interface LyricsHit {
  id: number;
  artist: string;
  track: string;
  album?: string;
  /** Seconds */
  duration: number;
  /** LRC text with time stamps, or null when only plain lyrics exist */
  synced: string | null;
  plain: string | null;
}

interface ApiHit {
  id: number;
  artistName: string;
  trackName: string;
  albumName?: string | null;
  duration: number;
  instrumental?: boolean;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

export class LyricsBusyError extends Error {
  constructor() {
    super("Söz veritabanı şu an yoğun, birkaç saniye sonra tekrar dene.");
  }
}

/** Waits `ms`, or rejects as soon as the search is cancelled. */
function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(signal.reason);
    });
  });
}

/** Delays before each retry. LRCLIB is free and busy: it often answers 503 or 429 for a moment. */
const RETRY_MS = [700, 1500, 3000];

async function fetchWithRetry(url: string, signal?: AbortSignal): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    let res: Response | null = null;
    try {
      res = await fetch(url, { signal, headers: { "Lrclib-Client": "almanca-pratik" } });
    } catch (e) {
      if (signal?.aborted) throw e;
      // network hiccup: retried like a busy server
    }
    if (res?.ok) return res;
    if (res && ![429, 500, 502, 503, 504].includes(res.status)) throw new Error(`Sözler aranamadı (${res.status})`);
    if (attempt >= RETRY_MS.length) throw new LyricsBusyError();
    await wait(RETRY_MS[attempt], signal);
  }
}

/** Some entries separate several artists with NUL and byte-order-mark characters. */
function tidy(s: string): string {
  return s
    .replace(/\u0000\uFEFF?/g, ", ")
    .replace(/\uFEFF/g, "")
    .trim();
}

export async function searchLyrics(artist: string, track: string, signal?: AbortSignal): Promise<LyricsHit[]> {
  const params = new URLSearchParams();
  if (artist.trim() && track.trim()) {
    params.set("artist_name", artist.trim());
    params.set("track_name", track.trim());
  } else params.set("q", `${artist} ${track}`.trim());
  const res = await fetchWithRetry(`${API}?${params}`, signal);
  const data = (await res.json()) as ApiHit[];
  return data
    .filter((h) => !h.instrumental && (h.syncedLyrics || h.plainLyrics))
    .map((h) => ({
      id: h.id,
      artist: tidy(h.artistName),
      track: tidy(h.trackName),
      album: h.albumName ? tidy(h.albumName) : undefined,
      duration: h.duration,
      synced: h.syncedLyrics || null,
      plain: h.plainLyrics || null,
    }))
    .sort((a, b) => Number(!!b.synced) - Number(!!a.synced));
}

export function formatDuration(sec: number): string {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
