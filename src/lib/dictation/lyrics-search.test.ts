import { afterEach, describe, expect, it, vi } from "vitest";
import { LyricsBusyError, searchLyrics } from "./lyrics-search";

const hit = {
  id: 1,
  artistName: "Rammstein\u0000﻿Feat",
  trackName: "Sonne",
  albumName: "Mutter",
  duration: 272,
  syncedLyrics: "[00:01.00] Eins",
  plainLyrics: "Eins",
};

function respond(status: number, body: unknown = []) {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("searchLyrics", () => {
  it("retries while the server is busy and tidies artist names", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockResolvedValueOnce(respond(503)).mockResolvedValueOnce(respond(429)).mockResolvedValueOnce(respond(200, [hit]));
    vi.stubGlobal("fetch", fetch);
    const p = searchLyrics("Rammstein", "Sonne");
    await vi.runAllTimersAsync();
    const hits = await p;
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(hits[0].artist).toBe("Rammstein, Feat");
  });

  it("gives up with a clear message after a few tries", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respond(503)));
    const p = searchLyrics("", "Sonne");
    const check = expect(p).rejects.toBeInstanceOf(LyricsBusyError);
    await vi.runAllTimersAsync();
    await check;
  });
});
