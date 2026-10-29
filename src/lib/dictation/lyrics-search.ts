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
  const res = await fetch(`${API}?${params}`, { signal, headers: { "Lrclib-Client": "almanca-pratik" } });
  if (!res.ok) throw new Error(`Sözler aranamadı (${res.status})`);
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
