"use client";

import { useRef, useState } from "react";
import { formatLyrics, parseLyrics, parseSubtitles, parseYouTubeId } from "@/lib/dictation/cloze";
import { formatDuration, searchLyrics, type LyricsHit } from "@/lib/dictation/lyrics-search";
import { saveSong, type UserSong } from "@/lib/dictation/store";
import { Button, Card, Chip, LABEL, Segmented, Spinner, cn } from "../ui";

const FIELD = "sketch sketch-thin sketch-once block w-full bg-sheet px-3 py-2 text-ink outline-none placeholder:text-pencil focus-visible:[--line:var(--color-blue-pencil)]";

export type TextMode = "ara" | "altyazi" | "yapistir";
type Media = "youtube" | "dosya" | "yok";

const EXAMPLE = `[00:14.20] Ich steh am Fenster | Pencerede duruyorum
[00:18.00] Und warte auf den Regen`;

/** Subtitle files are often saved in the old Windows encoding; read them so umlauts survive either way. */
async function readText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const utf8 = new TextDecoder("utf-8").decode(buf);
  return utf8.includes("�") ? new TextDecoder("windows-1252").decode(buf) : utf8;
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[._]+/g, " ").trim();
}

export function SongEditor({
  song,
  initialMode = "ara",
  onDone,
}: {
  song?: UserSong;
  initialMode?: TextMode;
  onDone: (saved?: UserSong) => void;
}) {
  const [title, setTitle] = useState(song?.title ?? "");
  const [kind, setKind] = useState<"song" | "film">(song?.kind ?? (initialMode === "altyazi" ? "film" : "song"));
  const [textMode, setTextMode] = useState<TextMode>(song ? "yapistir" : initialMode);
  const [lyrics, setLyrics] = useState(song ? formatLyrics(song.lines) : "");
  const [media, setMedia] = useState<Media>(song?.videoId ? "youtube" : song?.localFile ? "dosya" : song ? "yok" : initialMode === "altyazi" ? "dosya" : "youtube");
  const [link, setLink] = useState(song?.videoId ? `https://youtu.be/${song.videoId}` : "");
  const [artist, setArtist] = useState("");
  const [track, setTrack] = useState("");
  const [hits, setHits] = useState<LyricsHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchAbort = useRef<AbortController | null>(null);

  const lines = parseLyrics(lyrics);
  const timed = lines.filter((l) => l.start !== undefined).length;

  const search = async () => {
    if (!artist.trim() && !track.trim()) return;
    searchAbort.current?.abort();
    const ctrl = new AbortController();
    searchAbort.current = ctrl;
    setSearching(true);
    setError(null);
    try {
      setHits((await searchLyrics(artist, track, ctrl.signal)).slice(0, 8));
    } catch (e) {
      if (!ctrl.signal.aborted) setError(e instanceof Error && e.message.startsWith("Sözler") ? e.message : "Sözler aranamadı, bağlantını kontrol et.");
    } finally {
      if (!ctrl.signal.aborted) setSearching(false);
    }
  };

  const pick = (hit: LyricsHit) => {
    setLyrics(hit.synced ?? hit.plain ?? "");
    setTitle(`${hit.artist} – ${hit.track}`);
    setKind("song");
    setHits(null);
    setTextMode("yapistir");
  };

  const loadSubtitles = async (file: File) => {
    setError(null);
    const parsed = parseSubtitles(await readText(file));
    if (!parsed.length) return setError("Bu dosyada altyazı bulamadım. .srt ya da .vtt olmalı.");
    setLyrics(formatLyrics(parsed));
    setKind("film");
    if (!title.trim()) setTitle(baseName(file.name));
    setTextMode("yapistir");
  };

  const save = () => {
    const videoId = media === "youtube" ? parseYouTubeId(link) : undefined;
    if (videoId === null) return setError("Bu bir YouTube linki gibi görünmüyor.");
    if (!lines.length) return setError("Önce sözleri ya da altyazıyı ekle.");
    onDone(
      saveSong({
        id: song?.id,
        title: title.trim() || lines[0].text,
        kind,
        videoId,
        localFile: media === "dosya" || undefined,
        fileName: media === "dosya" ? song?.fileName : undefined,
        offset: song?.offset,
        lines,
      }),
    );
  };

  const youtubeSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(title || `${artist} ${track}`)}`;

  return (
    <Card className="animate-rise space-y-5">
      <h2 className="hand-bold text-xl">{song ? "Düzenle" : kind === "film" ? "Film sahnesi ekle" : "Şarkı ekle"}</h2>

      <section className="space-y-2">
        <p className={LABEL}>1. Metin</p>
        <Segmented
          kind="tab"
          label="Metnin kaynağı"
          value={textMode}
          onChange={(m) => {
            setTextMode(m);
            setError(null);
          }}
          options={[
            { value: "ara", label: "Sözleri bul" },
            { value: "altyazi", label: "Altyazı dosyası" },
            { value: "yapistir", label: lyrics ? "Metni gör" : "Yapıştır" },
          ]}
        />

        {textMode === "ara" && (
          <div className="space-y-3">
            <form
              className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
            >
              <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Sanatçı (ör. Rammstein)" className={FIELD} />
              <input value={track} onChange={(e) => setTrack(e.target.value)} placeholder="Şarkı (ör. Sonne)" className={FIELD} />
              <Button type="submit" variant="primary" disabled={searching}>
                {searching ? <Spinner /> : "Ara"}
              </Button>
            </form>
            <p className="text-xs text-pencil">Zaman damgalı sözler LRCLIB&apos;in açık veritabanından, senin tarayıcın üzerinden gelir.</p>
            {hits && !hits.length && <p className="text-sm text-graphite">Bulamadım. Adı farklı yazmayı dene ya da sözleri kendin yapıştır.</p>}
            {hits && hits.length > 0 && (
              <ul className="space-y-1.5">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => pick(h)}
                      className="sketch sketch-thin sketch-once flex w-full flex-wrap items-center gap-x-2 gap-y-1 bg-paper px-3 py-2 text-left transition-colors hover:bg-marker-soft"
                    >
                      <span className="hand-bold">{h.track}</span>
                      <span className="text-sm text-graphite">{h.artist}</span>
                      {h.album && <span className="text-xs text-pencil">· {h.album}</span>}
                      <span className="ml-auto flex items-center gap-1.5">
                        <span className="text-xs text-pencil tabular-nums">{formatDuration(h.duration)}</span>
                        <Chip tone={h.synced ? "success" : "warning"}>{h.synced ? "Senkronlu" : "Zamansız"}</Chip>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {textMode === "altyazi" && (
          <div className="space-y-2">
            <label className="sketch sketch-thin flex cursor-pointer flex-col items-center gap-1 bg-paper px-4 py-6 text-center transition-colors hover:bg-marker-soft">
              <span className="hand-bold">Almanca altyazı dosyasını seç</span>
              <span className="text-sm text-graphite">.srt ya da .vtt</span>
              <input
                type="file"
                accept=".srt,.vtt,text/vtt,application/x-subrip"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadSubtitles(f);
                }}
              />
            </label>
            <p className="text-xs text-pencil">
              Filmin Almanca altyazısını (ör. OpenSubtitles&apos;tan) ve videosunu kullan. İkisi de sadece senin tarayıcında açılır.
            </p>
          </div>
        )}

        {textMode === "yapistir" && (
          <div className="space-y-1">
            <textarea
              value={lyrics}
              onChange={(e) => {
                setLyrics(e.target.value);
                setError(null);
              }}
              rows={9}
              lang="de"
              spellCheck={false}
              placeholder={EXAMPLE}
              className={`${FIELD} resize-y font-mono text-sm leading-relaxed`}
            />
            <p className="text-xs leading-relaxed text-pencil">
              Her satıra bir dize, başında LRC zamanı ([00:14.20]). Türkçesini istersen <b>|</b> işaretinden sonra yaz.
            </p>
          </div>
        )}
        {lyrics && (
          <p className={cn("text-sm", timed ? "text-green-pencil" : "text-graphite")}>
            {lines.length} satır{timed ? `, ${timed} tanesi zamanlı: oynarken akacak` : ", zaman yok: kaydedince senkronlayabilirsin"}.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <p className={LABEL}>2. Ne çalsın?</p>
        <Segmented
          label="Oynatıcı"
          value={media}
          onChange={setMedia}
          options={[
            { value: "youtube", label: "YouTube" },
            { value: "dosya", label: "Kendi dosyam" },
            { value: "yok", label: "Sesli okuma" },
          ]}
        />
        {media === "youtube" && (
          <div className="space-y-1">
            <input
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setError(null);
              }}
              inputMode="url"
              placeholder="https://www.youtube.com/watch?v=…"
              className={FIELD}
            />
            <p className="text-xs text-pencil">
              Video YouTube&apos;un kendi oynatıcısında açılır.{" "}
              <a href={youtubeSearch} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-ink">
                YouTube&apos;da ara
              </a>
              , linki kopyalayıp buraya yapıştır. Resmi ses ya da &quot;lyrics&quot; videoları sözlerle en iyi örtüşür.
            </p>
          </div>
        )}
        {media === "dosya" && (
          <p className="text-sm text-graphite">Video ya da ses dosyasını (mp4, webm, mp3, m4a) oynatmadan hemen önce seçeceksin. Dosya hiçbir yere yüklenmez.</p>
        )}
        {media === "yok" && <p className="text-sm text-graphite">Satırları tarayıcının Almanca sesi okur.</p>}
      </section>

      <label className="block space-y-1">
        <span className={LABEL}>Ad</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Şarkının ya da sahnenin adı" className={FIELD} />
      </label>

      <p className="text-xs text-pencil">Sözler ve altyazılar sadece bu tarayıcıda saklanır, siteye yüklenmez.</p>
      {error && <p className="text-sm font-semibold text-red-pencil">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={save}>
          Kaydet
        </Button>
        <Button variant="ghost" onClick={() => onDone()}>
          Vazgeç
        </Button>
      </div>
    </Card>
  );
}
