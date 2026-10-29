"use client";

import { useEffect, useRef, type RefObject } from "react";

// YouTube's official embedded player (IFrame Player API). The video streams from YouTube itself;
// nothing is copied to this site. The privacy-enhanced youtube-nocookie.com host is used.

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  setPlaybackRate(rate: number): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      width?: string;
      height?: string;
      playerVars?: Record<string, number | string>;
      events?: { onReady?: () => void };
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("YouTube oynatıcısı yüklenemedi"));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export interface PlayerHandle {
  /** Plays from `start` and pauses at `end` (if given). */
  playClip(start: number, end?: number): void;
  play(): void;
  pause(): void;
  /** Current position in seconds (0 before the player is ready) */
  time(): number;
  seek(seconds: number): void;
  isPlaying(): boolean;
  setRate(rate: number): void;
}

/** YouTube's state code for "playing" */
const PLAYING = 1;

export function YouTubePlayer({
  videoId,
  handleRef,
  onReady,
  onError,
  className,
}: {
  videoId: string;
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
    let player: YTPlayer | null = null;
    let ready = false;
    let stopAt: number | undefined;
    let timer: number | undefined;
    let cancelled = false;

    const watch = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (player && stopAt !== undefined && player.getCurrentTime() >= stopAt) {
          player.pauseVideo();
          stopAt = undefined;
          window.clearInterval(timer);
        }
      }, 80);
    };

    handleRef.current = {
      playClip(start, end) {
        if (!player || !ready) return;
        stopAt = end;
        player.seekTo(start, true);
        player.playVideo();
        if (end !== undefined) watch();
      },
      play() {
        stopAt = undefined;
        if (ready) player?.playVideo();
      },
      pause() {
        if (ready) player?.pauseVideo();
      },
      time() {
        return ready && player ? player.getCurrentTime() : 0;
      },
      seek(seconds) {
        if (ready) player?.seekTo(Math.max(0, seconds), true);
      },
      isPlaying() {
        return ready && player?.getPlayerState() === PLAYING;
      },
      setRate(rate) {
        if (ready) player?.setPlaybackRate(rate);
      },
    };

    loadApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return;
        const el = document.createElement("div");
        hostRef.current.replaceChildren(el);
        player = new YT.Player(el, {
          videoId,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: () => {
              ready = true;
              callbacks.current.onReady?.();
            },
          },
        });
      })
      .catch((e: Error) => callbacks.current.onError?.(e.message));

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      player?.destroy();
      handleRef.current = null;
    };
  }, [videoId, handleRef]);

  return (
    <div className={className}>
      <div ref={hostRef} className="size-full" />
    </div>
  );
}
