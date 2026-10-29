"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { PlayerHandle } from "./YouTubePlayer";

// Spotify's official embedded player (Embed iFrame API). Signed-in listeners hear the whole track;
// otherwise Spotify plays a 30-second preview.

interface PlaybackUpdate {
  data: { isPaused: boolean; isBuffering: boolean; duration: number; position: number };
}

interface EmbedController {
  addListener(event: "ready", cb: () => void): void;
  addListener(event: "playback_update", cb: (e: PlaybackUpdate) => void): void;
  play(): void;
  resume(): void;
  pause(): void;
  seek(seconds: number): void;
  destroy(): void;
}

interface SpotifyIFrameAPI {
  createController(el: HTMLElement, opts: { uri: string; width?: string | number; height?: string | number }, cb: (c: EmbedController) => void): void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

let apiPromise: Promise<SpotifyIFrameAPI> | null = null;

function loadApi(): Promise<SpotifyIFrameAPI> {
  apiPromise ??= new Promise((resolve, reject) => {
    window.onSpotifyIframeApiReady = resolve;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("Spotify oynatıcısı yüklenemedi"));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export function SpotifyPlayer({
  trackId,
  handleRef,
  onReady,
  onError,
  className,
}: {
  trackId: string;
  handleRef: RefObject<PlayerHandle | null>;
  onReady?: () => void;
  onError?: (message: string) => void;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onError });
  useEffect(() => {
    callbacks.current = { onReady, onError };
  });

  useEffect(() => {
    let controller: EmbedController | null = null;
    let cancelled = false;
    let started = false;
    // Spotify reports the position about once a second; between reports it is extrapolated.
    let position = 0;
    let at = performance.now();
    let paused = true;
    let stopAt: number | undefined;

    const now = () => (paused ? position : position + (performance.now() - at) / 1000);
    const play = () => {
      if (!controller) return;
      if (started) controller.resume();
      else controller.play();
      started = true;
    };

    handleRef.current = {
      playClip(start, end) {
        stopAt = end;
        controller?.seek(start);
        play();
      },
      play() {
        stopAt = undefined;
        play();
      },
      pause() {
        controller?.pause();
      },
      time: now,
      seek(seconds) {
        position = Math.max(0, seconds);
        at = performance.now();
        controller?.seek(position);
      },
      isPlaying() {
        return !paused;
      },
      setRate() {
        // the Spotify embed has no speed control
      },
    };

    const timer = window.setInterval(() => {
      if (stopAt !== undefined && !paused && now() >= stopAt) {
        controller?.pause();
        stopAt = undefined;
      }
    }, 80);

    loadApi()
      .then((api) => {
        if (cancelled || !hostRef.current) return;
        const el = document.createElement("div");
        hostRef.current.replaceChildren(el);
        api.createController(el, { uri: `spotify:track:${trackId}`, width: "100%", height: 152 }, (c) => {
          if (cancelled) return c.destroy();
          controller = c;
          c.addListener("ready", () => callbacks.current.onReady?.());
          c.addListener("playback_update", (e) => {
            position = e.data.position / 1000;
            at = performance.now();
            paused = e.data.isPaused || e.data.isBuffering;
          });
        });
      })
      .catch((e: Error) => callbacks.current.onError?.(e.message));

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      controller?.destroy();
      handleRef.current = null;
    };
  }, [trackId, handleRef]);

  return <div ref={hostRef} className={className} />;
}
