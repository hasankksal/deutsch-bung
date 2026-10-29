import { parseYouTubeId } from "./cloze";
import type { LyricsHit } from "./lyrics-search";

// A pasted YouTube or Spotify link is enough to find the song: the services' public oEmbed
// endpoints give the title, and the lyrics are searched with it.

export type MediaLink = { kind: "youtube"; id: string } | { kind: "spotify"; id: string };

/** Spotify track links (open.spotify.com/track/…, with or without a locale part) and spotify:track: URIs. */
export function parseSpotifyId(input: string): string | null {
  const s = input.trim();
  const uri = /^spotify:track:([A-Za-z0-9]{22})$/.exec(s);
  if (uri) return uri[1];
  const m = /^(?:https?:\/\/)?open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?track\/([A-Za-z0-9]{22})/i.exec(s);
  return m ? m[1] : null;
}

export function parseMediaLink(input: string): MediaLink | null {
  const sp = parseSpotifyId(input);
  if (sp) return { kind: "spotify", id: sp };
  const yt = input.trim() ? parseYouTubeId(input) : null;
  return yt ? { kind: "youtube", id: yt } : null;
}

const NOISE =
  /\s*[([][^)\]]*\b(official|video|lyrics?|lyric|audio|clip|hd|4k|remaster(ed)?|live|songtext|visuali[sz]er|mv|feat\.?|ft\.?|prod\.?)\b[^)\]]*[)\]]/gi;

/** Splits a video title like "Rammstein - Sonne (Official Video)" into artist and track. */
export function guessArtistTrack(title: string, author = ""): { artist: string; track: string } {
  const clean = title
    .replace(NOISE, "")
    .replace(/\s+(official\s+(music\s+)?video|lyrics?|songtext)\s*$/i, "")
    .replace(/\s+(feat\.?|ft\.?)\s.*$/i, "")
    .replace(/["“”„]/g, "")
    .trim();
  const parts = clean.split(/\s+[-–—|]\s+/);
  if (parts.length >= 2) return { artist: parts[0].trim(), track: parts.slice(1).join(" - ").trim() };
  return { artist: author.replace(/\s*VEVO$/i, "").replace(/\s+-\s+Topic$/i, "").trim(), track: clean };
}

export interface LinkInfo {
  artist: string;
  track: string;
  /** What the service calls it, shown to the learner */
  title: string;
}

/** Title (and for YouTube the channel) of a pasted link. */
export async function fetchLinkInfo(link: MediaLink, signal?: AbortSignal): Promise<LinkInfo> {
  const url =
    link.kind === "youtube"
      ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${link.id}`)}`
      : `https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/track/${link.id}`)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Linkin bilgisi alınamadı");
  const data = (await res.json()) as { title?: string; author_name?: string };
  const title = data.title ?? "";
  if (link.kind === "spotify") return { artist: "", track: title.trim(), title };
  return { ...guessArtistTrack(title, data.author_name), title };
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ß]+/g, " ")
    .trim();
}

/**
 * The likeliest lyrics for a title: complete lyrics first, then synced ones, then the same track name,
 * then the same artist.
 * Without an artist (Spotify gives only the title) the artist found most often wins: the original
 * shows up on many albums and compilations, a cover only once or twice.
 */
export function pickBest(hits: LyricsHit[], want: { artist: string; track: string }): LyricsHit | null {
  // a handful of lines is a placeholder or a joke entry, not the song
  const full = (h: LyricsHit) => ((h.synced ?? h.plain ?? "").match(/\S.*$/gm)?.length ?? 0) >= 8;
  const count = new Map<string, number>();
  for (const h of hits) count.set(norm(h.artist), (count.get(norm(h.artist)) ?? 0) + 1);
  const score = (h: LyricsHit) =>
    (full(h) ? 8 : 0) +
    (h.synced ? 4 : 0) +
    (norm(h.track) === norm(want.track) ? 2 : 0) +
    (want.artist && norm(h.artist) === norm(want.artist) ? 1 : 0) +
    (0.9 * (count.get(norm(h.artist)) ?? 0)) / hits.length;
  let best: LyricsHit | null = null;
  for (const h of hits) if (!best || score(h) > score(best)) best = h;
  return best;
}
