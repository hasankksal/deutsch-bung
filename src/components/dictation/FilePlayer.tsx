"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { PlayerHandle } from "./YouTubePlayer";

/** Plays a video or audio file from the learner's own device. The file never leaves the browser. */
export function FilePlayer({
  url,
  audio,
  handleRef,
  onReady,
  className,
}: {
  /** Object URL of the picked file */
  url: string;
  audio: boolean;
  handleRef: RefObject<PlayerHandle | null>;
  onReady?: () => void;
  className?: string;
}) {
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el) return;
    let stopAt: number | undefined;
    const onTime = () => {
      if (stopAt !== undefined && el.currentTime >= stopAt) {
        el.pause();
        stopAt = undefined;
      }
    };
    el.addEventListener("timeupdate", onTime);
    handleRef.current = {
      playClip(start, end) {
        stopAt = end;
        el.currentTime = start;
        el.play().catch(() => {});
      },
      play() {
        stopAt = undefined;
        el.play().catch(() => {});
      },
      pause() {
        el.pause();
      },
      time() {
        return el.currentTime;
      },
      seek(seconds) {
        el.currentTime = Math.max(0, seconds);
      },
      isPlaying() {
        return !el.paused && !el.ended;
      },
      setRate(rate) {
        el.playbackRate = rate;
      },
    };
    return () => {
      el.removeEventListener("timeupdate", onTime);
      handleRef.current = null;
    };
  }, [handleRef, url]);

  const props = { ref: mediaRef, src: url, controls: true, playsInline: true, preload: "auto", onLoadedMetadata: onReady };
  return audio ? (
    <div className={className}>
      <audio {...props} className="w-full" />
    </div>
  ) : (
    <div className={className}>
      <video {...props} className="size-full bg-ink" />
    </div>
  );
}
