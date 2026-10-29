import { describe, expect, it } from "vitest";
import { guessArtistTrack, parseMediaLink, parseSpotifyId, pickBest } from "./link";
import type { LyricsHit } from "./lyrics-search";

describe("parseSpotifyId", () => {
  const id = "4uLU6hMCjMI75M1A2tKUQC";
  it("reads track links and URIs", () => {
    expect(parseSpotifyId(`https://open.spotify.com/track/${id}?si=abc`)).toBe(id);
    expect(parseSpotifyId(`https://open.spotify.com/intl-tr/track/${id}`)).toBe(id);
    expect(parseSpotifyId(`open.spotify.com/track/${id}`)).toBe(id);
    expect(parseSpotifyId(`spotify:track:${id}`)).toBe(id);
  });
  it("rejects albums and other links", () => {
    expect(parseSpotifyId(`https://open.spotify.com/album/${id}`)).toBeNull();
    expect(parseSpotifyId("https://youtu.be/dQw4w9WgXcQ")).toBeNull();
  });
});

describe("parseMediaLink", () => {
  it("tells YouTube and Spotify apart", () => {
    expect(parseMediaLink("https://youtu.be/dQw4w9WgXcQ")).toEqual({ kind: "youtube", id: "dQw4w9WgXcQ" });
    expect(parseMediaLink("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")).toEqual({ kind: "spotify", id: "4uLU6hMCjMI75M1A2tKUQC" });
    expect(parseMediaLink("")).toBeNull();
  });
});

describe("guessArtistTrack", () => {
  it("splits common video titles", () => {
    expect(guessArtistTrack("Rammstein - Sonne (Official Video)")).toEqual({ artist: "Rammstein", track: "Sonne" });
    expect(guessArtistTrack("AnnenMayKantereit – Pocahontas [Official Video]")).toEqual({ artist: "AnnenMayKantereit", track: "Pocahontas" });
    expect(guessArtistTrack("Apache 207 - Roller (prod. by Juh-Dee)")).toEqual({ artist: "Apache 207", track: "Roller" });
    expect(guessArtistTrack("Mark Forster - Chöre (Lyrics)")).toEqual({ artist: "Mark Forster", track: "Chöre" });
  });
  it("falls back to the channel name", () => {
    expect(guessArtistTrack("Sonne", "RammsteinVEVO")).toEqual({ artist: "Rammstein", track: "Sonne" });
    expect(guessArtistTrack("Chöre", "Mark Forster - Topic")).toEqual({ artist: "Mark Forster", track: "Chöre" });
  });
});

describe("pickBest", () => {
  const hit = (id: number, artist: string, track: string, synced: boolean): LyricsHit => ({
    id,
    artist,
    track,
    duration: 200,
    synced: synced ? Array.from({ length: 10 }, (_, i) => `[00:0${i}.00] Zeile ${i}`).join("\n") : null,
    plain: Array.from({ length: 10 }, (_, i) => `Zeile ${i}`).join("\n"),
  });
  it("prefers synced lyrics of the same track and artist", () => {
    const hits = [hit(1, "Cover Band", "Sonne", false), hit(2, "Someone", "Sonne (Live)", true), hit(3, "Rammstein", "Sonne", true)];
    expect(pickBest(hits, { artist: "Rammstein", track: "Sonne" })?.id).toBe(3);
    expect(pickBest([], { artist: "", track: "x" })).toBeNull();
  });

  it("skips joke entries with almost no lines", () => {
    const joke = { ...hit(1, "Rick Astley", "Sonne", true), synced: "[00:01.00] *Rickrolling*" };
    const hits = [joke, joke, hit(2, "Rammstein", "Sonne", true)];
    expect(pickBest(hits, { artist: "", track: "Sonne" })?.id).toBe(2);
  });

  it("without an artist, takes the one found most often", () => {
    const hits = [hit(1, "Cover Band", "Sonne", true), hit(2, "Rammstein", "Sonne", true), hit(3, "Rammstein", "Sonne", true)];
    expect(pickBest(hits, { artist: "", track: "Sonne" })?.artist).toBe("Rammstein");
  });
});
