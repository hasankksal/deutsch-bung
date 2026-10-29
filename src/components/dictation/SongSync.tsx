"use client";

import { useEffect, useRef, useState } from "react";
import { setSongTimes, type UserSong } from "@/lib/dictation/store";
import { Button, Card, LABEL, cn } from "../ui";
import { YouTubePlayer, type PlayerHandle } from "./YouTubePlayer";

/** Play the video and tap once as each line begins; the taps become the lines' start times. */
export function SongSync({ song, onDone }: { song: UserSong & { videoId: string }; onDone: () => void }) {
  const player = useRef<PlayerHandle | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starts, setStarts] = useState<number[]>([]);
  const index = starts.length;
  const finished = index >= song.lines.length;

  const mark = () => {
    if (finished || !player.current) return;
    setStarts((s) => [...s, Math.max(0, player.current!.time() - 0.15)]);
  };
  const markRef = useRef(mark);
  useEffect(() => {
    markRef.current = mark;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      markRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const startOver = () => {
    setStarts([]);
    player.current?.playClip(0);
  };

  const save = () => {
    setSongTimes(song.id, starts);
    player.current?.pause();
    onDone();
  };

  return (
    <Card className="animate-rise space-y-4">
      <div>
        <h2 className="hand-bold text-xl">Senkronla: {song.title}</h2>
        <p className="mt-1 text-sm text-graphite">
          Videoyu baştan başlat, her satır söylenmeye başladığında <b>Şimdi</b>&apos;ye (ya da boşluk tuşuna) bas.
        </p>
      </div>

      <div className="sketch sketch-bold overflow-hidden bg-ink p-1.5">
        <YouTubePlayer videoId={song.videoId} handleRef={player} className="aspect-video w-full" onReady={() => setReady(true)} onError={setError} />
      </div>
      {error && <p className="text-sm text-red-pencil">{error}</p>}

      <div className="sketch lined bg-sheet px-5 py-4">
        <p className={LABEL}>{finished ? "Hepsi işaretlendi" : `Sıradaki satır (${index + 1}/${song.lines.length})`}</p>
        <p lang="de" className="hand-bold mt-1 text-xl">
          {finished ? "Kaydedip oynayabilirsin." : song.lines[index].text}
        </p>
        {!finished && song.lines[index + 1] && (
          <p lang="de" className="mt-1 text-pencil">
            sonra: {song.lines[index + 1].text}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" size="lg" onClick={mark} disabled={!ready || finished}>
          Şimdi
        </Button>
        <Button onClick={startOver} disabled={!ready}>
          {index ? "Baştan" : "Videoyu başlat"}
        </Button>
        <Button variant="ghost" onClick={() => setStarts((s) => s.slice(0, -1))} disabled={!index}>
          Geri al
        </Button>
      </div>

      <ol className="max-h-48 space-y-0.5 overflow-y-auto text-sm">
        {song.lines.map((l, i) => (
          <li key={i} className={cn("flex gap-3", i === index ? "font-bold text-ink" : i < index ? "text-green-pencil" : "text-pencil")}>
            <span className="w-12 shrink-0 tabular-nums">{starts[i] !== undefined ? starts[i].toFixed(1) + " sn" : ""}</span>
            <span lang="de" className="truncate">
              {l.text}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={save} disabled={!index}>
          Kaydet{!finished && index ? ` (${index} satır)` : ""}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Vazgeç
        </Button>
      </div>
    </Card>
  );
}
