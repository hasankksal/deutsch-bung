"use client";

import { useState } from "react";
import { levelLabel } from "@/lib/curriculum";
import { lineEnd, type Difficulty } from "@/lib/dictation/cloze";
import { KIND_LABEL, SCENES, type Scene } from "@/lib/dictation/scenes";
import { removeSong, setSongFileName, setSongOffset, useDictationState, type BestScore, type UserSong } from "@/lib/dictation/store";
import { useHydrated } from "@/lib/store";
import { Icon } from "../icons";
import { Button, Card, Chip, LABEL, Segmented, cn } from "../ui";
import { DictationGame, DIFFICULTY_LABEL, type GameLine } from "./DictationGame";
import { LiveGame, type LiveSource } from "./LiveGame";
import { SongEditor, type TextMode } from "./SongEditor";
import { SongSync } from "./SongSync";

type Tab = "benim" | "hazir";
type View =
  | { kind: "list" }
  | { kind: "play"; key: string; title: string; lines: GameLine[]; videoId?: string }
  | { kind: "pick"; songId: string }
  | { kind: "live"; songId: string; source: LiveSource }
  | { kind: "edit"; song?: UserSong; mode?: TextMode }
  | { kind: "sync"; song: UserSong & { videoId: string } };

const DIFFICULTIES: Difficulty[] = ["kolay", "orta", "zor"];
const DIFFICULTY_HINT: Record<Difficulty, string> = {
  kolay: "Uzun kelimelerin üçte biri boş",
  orta: "Kelimelerin yarısından fazlası boş",
  zor: "Satırın tamamını duyduğun gibi yaz",
};

function sceneLines(scene: Scene): GameLine[] {
  return scene.lines.map((l) => ({ de: l.de, tr: l.tr, speaker: l.speaker }));
}

function songLines(song: UserSong): GameLine[] {
  const shift = song.offset ?? 0;
  return song.lines.map((l, i) => {
    const end = lineEnd(song.lines, i);
    return {
      de: l.text,
      tr: l.tr,
      start: song.videoId && l.start !== undefined ? l.start + shift : undefined,
      end: song.videoId && end !== undefined ? end + shift : undefined,
    };
  });
}

const isTimed = (song: UserSong) => song.lines.some((l) => l.start !== undefined);

function Best({ score }: { score?: BestScore }) {
  if (!score) return null;
  return (
    <span className="font-note text-lg font-bold text-green-pencil" title="En iyi sonucun">
      ★ %{score.accuracy}
      {score.cpm ? ` · ${score.cpm} harf/dk` : ""}
    </span>
  );
}

/** Asks for the video or audio file right before playing; it is opened locally, never uploaded. */
function PickFile({ song, onPick, onCancel }: { song: UserSong; onPick: (file: File) => void; onCancel: () => void }) {
  return (
    <Card className="animate-rise space-y-4">
      <h2 lang="de" className="hand-bold text-xl">
        {song.title}
      </h2>
      <label className="sketch sketch-thin flex cursor-pointer flex-col items-center gap-1 bg-paper px-4 py-10 text-center transition-colors hover:bg-marker-soft">
        <span className="hand-bold text-lg">Video ya da ses dosyasını seç</span>
        <span className="text-sm text-graphite">{song.fileName ? `Geçen sefer: ${song.fileName}` : "mp4, webm, mp3, m4a…"}</span>
        <input
          type="file"
          accept="video/*,audio/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
          }}
        />
      </label>
      <p className="text-xs text-pencil">Dosya sadece bu sekmede açılır, hiçbir yere yüklenmez.</p>
      <Button variant="ghost" onClick={onCancel}>
        Vazgeç
      </Button>
    </Card>
  );
}

export function DictationView() {
  const hydrated = useHydrated();
  const { songs, best } = useDictationState();
  const [tab, setTab] = useState<Tab>("benim");
  const [difficulty, setDifficulty] = useState<Difficulty>("orta");
  const [view, setView] = useState<View>({ kind: "list" });

  const toList = () => {
    if (view.kind === "live" && view.source.kind === "file") URL.revokeObjectURL(view.source.url);
    setView({ kind: "list" });
  };

  if (view.kind === "play") {
    const harder = DIFFICULTIES[DIFFICULTIES.indexOf(difficulty) + 1];
    return (
      <DictationGame
        key={`${view.key}:${difficulty}`}
        title={view.title}
        lines={view.lines}
        difficulty={difficulty}
        scoreKey={view.key}
        videoId={view.videoId}
        onExit={toList}
        onHarder={harder ? () => setDifficulty(harder) : undefined}
      />
    );
  }
  if (view.kind === "live") {
    const song = songs.find((s) => s.id === view.songId);
    if (song)
      return (
        <LiveGame
          title={song.title}
          lines={song.lines}
          source={view.source}
          difficulty={difficulty}
          scoreKey={`song:${song.id}`}
          offset={song.offset ?? 0}
          onOffset={(o) => setSongOffset(song.id, o)}
          onExit={toList}
        />
      );
  }
  if (view.kind === "pick") {
    const song = songs.find((s) => s.id === view.songId);
    if (song)
      return (
        <PickFile
          song={song}
          onCancel={toList}
          onPick={(file) => {
            if (file.name !== song.fileName) setSongFileName(song.id, file.name);
            setView({ kind: "live", songId: song.id, source: { kind: "file", url: URL.createObjectURL(file), audio: file.type.startsWith("audio/") } });
          }}
        />
      );
  }
  if (view.kind === "edit") return <SongEditor song={view.song} initialMode={view.mode} onDone={toList} />;
  if (view.kind === "sync") return <SongSync song={view.song} onDone={toList} />;

  const playScene = (scene: Scene) => setView({ kind: "play", key: `scene:${scene.id}`, title: scene.title, lines: sceneLines(scene) });
  const playSong = (song: UserSong) => {
    if (isTimed(song) && song.localFile) return setView({ kind: "pick", songId: song.id });
    if (isTimed(song) && song.videoId) return setView({ kind: "live", songId: song.id, source: { kind: "youtube", videoId: song.videoId } });
    setView({ kind: "play", key: `song:${song.id}`, title: song.title, lines: songLines(song), videoId: song.videoId });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="hand-bold wobble-text text-3xl">Dinle &amp; Yaz</h1>
        <p className="mt-2 max-w-prose text-graphite">
          Gerçek bir şarkı ya da film sahnesi çalarken sözler akar; vurgulu satırdaki boşlukları duyduğun gibi yaz. Yanlış harf kabul
          edilmez, yetişemezsen şarkı seni bekler.
        </p>
      </div>

      <div className="space-y-1.5">
        <p className={LABEL}>Zorluk</p>
        <Segmented
          label="Zorluk"
          value={difficulty}
          onChange={setDifficulty}
          options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_LABEL[d], title: DIFFICULTY_HINT[d] }))}
        />
        <p className="text-sm text-pencil">{DIFFICULTY_HINT[difficulty]}</p>
      </div>

      <Segmented
        kind="tab"
        label="İçerik"
        value={tab}
        onChange={setTab}
        options={[
          { value: "benim", label: "Şarkı & film" },
          { value: "hazir", label: "Hazır metinler" },
        ]}
      />

      {tab === "benim" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setView({ kind: "edit", mode: "ara" })}
              className="sketch jitter-hover -rotate-[0.5deg] bg-marker px-4 py-4 text-left transition hover:rotate-0"
            >
              <span className="hand-bold block text-lg">+ Şarkı ekle</span>
              <span className="text-sm text-ink/80">Sanatçıyı ve şarkıyı yaz, zamanlı sözler gelsin; YouTube&apos;dan ya da kendi mp3&apos;ünden çal.</span>
            </button>
            <button
              type="button"
              onClick={() => setView({ kind: "edit", mode: "altyazi" })}
              className="sketch jitter-hover rotate-[0.5deg] bg-sheet px-4 py-4 text-left transition hover:rotate-0 hover:bg-white"
            >
              <span className="hand-bold block text-lg">+ Film sahnesi ekle</span>
              <span className="text-sm text-graphite">Almanca altyazı dosyası (.srt) ve videoyu seç; replikler oynarken boşlukları doldur.</span>
            </button>
          </div>

          {hydrated && !songs.length && (
            <p className="margin-note text-graphite">Listen boş. İlk şarkını ekle; sözler ve altyazılar sadece bu tarayıcıda saklanır.</p>
          )}

          <ul className="space-y-3">
            {songs.map((song) => {
              const timed = isTimed(song);
              const media = song.videoId ? "YouTube" : song.localFile ? "Kendi dosyan" : "Sesli okuma";
              return (
                <li key={song.id}>
                  <Card className="space-y-2 p-4 sm:p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span lang="de" className="hand-bold text-lg">
                        {song.title}
                      </span>
                      <Chip tone={song.kind === "film" ? "neutral" : "warning"}>{song.kind === "film" ? "Film" : "Şarkı"}</Chip>
                      <Chip>{song.lines.length} satır</Chip>
                      <Chip tone={timed ? "success" : "neutral"}>{timed ? `${media} · akar` : media}</Chip>
                    </div>
                    <Best score={best[`song:${song.id}:${difficulty}`]} />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button variant="primary" size="sm" onClick={() => playSong(song)}>
                        Oyna
                      </Button>
                      {song.videoId && (
                        <Button size="sm" onClick={() => setView({ kind: "sync", song: { ...song, videoId: song.videoId! } })}>
                          {timed ? "Yeniden senkronla" : "Senkronla"}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setView({ kind: "edit", song })}>
                        Düzenle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`${song.title} sil`}
                        onClick={() => {
                          if (window.confirm(`"${song.title}" silinsin mi?`)) removeSong(song.id);
                        }}
                      >
                        <Icon name="trash" className="size-4" />
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-graphite">Isınmak için: sitenin kendi diyalogları ve telifsiz eski şiirler, tarayıcının sesiyle okunur.</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {SCENES.map((scene, i) => (
              <li key={scene.id}>
                <button
                  type="button"
                  onClick={() => playScene(scene)}
                  className={cn(
                    "sketch jitter-hover flex h-full w-full flex-col gap-2 bg-sheet p-4 text-left transition hover:rotate-0 hover:bg-white",
                    i % 2 ? "rotate-[0.4deg]" : "-rotate-[0.4deg]",
                  )}
                >
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Chip tone={scene.kind === "sahne" ? "warning" : "neutral"}>{KIND_LABEL[scene.kind]}</Chip>
                    <Chip>{levelLabel(scene.level)}</Chip>
                    <span className="ml-auto text-xs text-pencil">{scene.lines.length} satır</span>
                  </span>
                  <span lang="de" className="hand-bold text-lg leading-snug">
                    {scene.title}
                  </span>
                  <span className="text-sm text-graphite">{scene.blurb}</span>
                  {scene.source && <span className="font-note text-base text-pencil">{scene.source}</span>}
                  {hydrated && <Best score={best[`scene:${scene.id}:${difficulty}`]} />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
