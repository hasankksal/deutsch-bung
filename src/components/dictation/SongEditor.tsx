"use client";

import { useRef, useState } from "react";
import { formatLyrics, parseLyrics, parseSubtitles } from "@/lib/dictation/cloze";
import { fetchLinkInfo, linkProblem, parseMediaLink, pickBest, type MediaLink } from "@/lib/dictation/link";
import { formatDuration, LyricsBusyError, searchLyrics, type LyricsHit } from "@/lib/dictation/lyrics-search";
import { saveSong, type UserSong } from "@/lib/dictation/store";
import { Button, Card, Chip, LABEL, Segmented, Spinner, cn } from "../ui";

const FIELD = "sketch sketch-thin sketch-once block w-full bg-sheet px-3 py-2 text-ink outline-none placeholder:text-pencil focus-visible:[--line:var(--color-blue-pencil)]";

export type TextMode = "ara" | "altyazi" | "yapistir";
type Media = "youtube" | "spotify" | "dosya" | "yok";
type LinkStatus = { kind: "idle" } | { kind: "loading" } | { kind: "found"; title: string } | { kind: "error"; message: string };

const EXAMPLE = `[00:14.20] Ich steh am Fenster | Pencerede duruyorum
[00:18.00] Und warte auf den Regen`;

/** Subtitle files are often saved in the old Windows encoding; read them so umlauts survive either way. */
async function readText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const utf8 = new TextDecoder("utf-8").decode(buf);
  return utf8.includes("�") ? new TextDecoder("windows-1252").decode(buf) : utf8;
}

function searchErrorText(e: unknown): string {
  if (e instanceof LyricsBusyError) return e.message;
  if (e instanceof Error && e.message.startsWith("Sözler")) return e.message;
  return "Sözler aranamadı, internet bağlantını kontrol et.";
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[._]+/g, " ").trim();
}

function initialLink(song?: UserSong): string {
  if (song?.videoId) return `https://youtu.be/${song.videoId}`;
  if (song?.spotifyId) return `https://open.spotify.com/track/${song.spotifyId}`;
  return "";
}

function initialMedia(song: UserSong | undefined, mode: TextMode): Media {
  if (song?.videoId) return "youtube";
  if (song?.spotifyId) return "spotify";
  if (song?.localFile) return "dosya";
  if (song) return "yok";
  return mode === "altyazi" ? "dosya" : "youtube";
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
  const [media, setMedia] = useState<Media>(initialMedia(song, initialMode));
  const [link, setLink] = useState(initialLink(song));
  const [linkStatus, setLinkStatus] = useState<LinkStatus>({ kind: "idle" });
  const [artist, setArtist] = useState("");
  const [track, setTrack] = useState("");
  const [hits, setHits] = useState<LyricsHit[] | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const lookedUp = useRef<string>("");

  const lines = parseLyrics(lyrics);
  const timed = lines.filter((l) => l.start !== undefined).length;
  const parsedLink = parseMediaLink(link);

  const fresh = () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    return ctrl;
  };

  const pick = (hit: LyricsHit) => {
    setLyrics(hit.synced ?? hit.plain ?? "");
    setTitle(`${hit.artist} – ${hit.track}`);
    setKind("song");
    setChosen(hit.id);
  };

  /** Runs a lyrics search; with `auto`, also takes the likeliest result. Returns the results. */
  const runSearch = async (a: string, t: string, ctrl: AbortController, auto: boolean): Promise<LyricsHit[]> => {
    let found = await searchLyrics(a, t, ctrl.signal);
    if (!found.length && a && t) found = await searchLyrics("", `${a} ${t}`, ctrl.signal);
    const best = auto ? pickBest(found, { artist: a, track: t }) : null;
    setHits(best ? [best, ...found.filter((h) => h !== best)].slice(0, 8) : found.slice(0, 8));
    if (best) pick(best);
    return found;
  };

  const search = async () => {
    if (!artist.trim() && !track.trim()) return;
    const ctrl = fresh();
    setSearching(true);
    setError(null);
    try {
      await runSearch(artist, track, ctrl, false);
    } catch (e) {
      if (!ctrl.signal.aborted) setError(searchErrorText(e));
    } finally {
      if (!ctrl.signal.aborted) setSearching(false);
    }
  };

  /** A pasted YouTube or Spotify link: read its title and fetch the lyrics that go with it. */
  const lookUp = async (ml: MediaLink, again = false) => {
    const key = `${ml.kind}:${ml.id}`;
    if (lookedUp.current === key && !again) return;
    lookedUp.current = key;
    setMedia(ml.kind);
    setError(null);
    if (song) return; // editing: keep the lyrics that are already there
    const ctrl = fresh();
    setLinkStatus({ kind: "loading" });
    setTextMode("ara");
    const fail = (message: string) => {
      if (ctrl.signal.aborted) return;
      lookedUp.current = ""; // pasting the same link again tries again
      setLinkStatus({ kind: "error", message });
    };
    let info;
    try {
      info = await fetchLinkInfo(ml, ctrl.signal);
    } catch {
      return fail("Linkin başlığını okuyamadım (video gizli ya da kısıtlı olabilir). Şarkıyı aşağıdan adıyla ara.");
    }
    setArtist(info.artist);
    setTrack(info.track);
    try {
      const found = await runSearch(info.artist, info.track, ctrl, true);
      if (found.length) setLinkStatus({ kind: "found", title: info.title });
      else fail(`"${info.title}" için söz bulamadım. Aşağıda sanatçıyı ya da adı düzeltip tekrar ara.`);
    } catch (e) {
      fail(searchErrorText(e));
    }
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
    if ((media === "youtube" || media === "spotify") && parsedLink?.kind !== media)
      return setError(media === "youtube" ? "Yukarıya bir YouTube linki yapıştır." : "Yukarıya bir Spotify şarkı linki yapıştır.");
    if (!lines.length) return setError("Önce sözleri ya da altyazıyı ekle.");
    onDone(
      saveSong({
        id: song?.id,
        title: title.trim() || lines[0].text,
        kind,
        videoId: media === "youtube" ? parsedLink?.id : undefined,
        spotifyId: media === "spotify" ? parsedLink?.id : undefined,
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

      <section className="space-y-1.5">
        <p className={LABEL}>YouTube ya da Spotify linki</p>
        <input
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setError(null);
            const ml = parseMediaLink(e.target.value);
            if (ml) lookUp(ml);
            else {
              const problem = linkProblem(e.target.value);
              setLinkStatus(problem ? { kind: "error", message: problem } : { kind: "idle" });
            }
          }}
          inputMode="url"
          autoFocus={!song && initialMode === "ara"}
          placeholder="Linki yapıştır, şarkıyı ve sözlerini ben bulayım"
          className={cn(FIELD, "py-3 text-lg")}
        />
        {linkStatus.kind === "loading" && (
          <p className="flex items-center gap-2 text-sm text-graphite">
            <Spinner /> Şarkı ve sözleri aranıyor…
          </p>
        )}
        {linkStatus.kind === "found" && (
          <p className="text-sm text-green-pencil">
            Buldum: <b>{linkStatus.title}</b>. Sözler aşağıda; yanlışsa listeden başkasını seç.
          </p>
        )}
        {linkStatus.kind === "error" && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-red-pencil">{linkStatus.message}</p>
            {parsedLink && (
              <Button size="sm" onClick={() => lookUp(parsedLink, true)}>
                Tekrar dene
              </Button>
            )}
          </div>
        )}
        {linkStatus.kind === "idle" && !link && (
          <p className="text-xs text-pencil">
            Spotify&apos;da paylaş → bağlantıyı kopyala, ya da YouTube&apos;da videonun adresini kopyala. Film için aşağıdan altyazı dosyası seç.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <p className={LABEL}>Metin</p>
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
                      aria-pressed={chosen === h.id}
                      className={cn(
                        "sketch sketch-thin sketch-once flex w-full flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-left transition-colors hover:bg-marker-soft",
                        chosen === h.id ? "bg-marker-soft [--line:var(--color-ink)]" : "bg-paper",
                      )}
                    >
                      <span className="hand-bold">{h.track}</span>
                      <span className="text-sm text-graphite">{h.artist}</span>
                      {h.album && <span className="text-xs text-pencil">· {h.album}</span>}
                      <span className="ml-auto flex items-center gap-1.5">
                        <span className="text-xs text-pencil tabular-nums">{formatDuration(h.duration)}</span>
                        {chosen === h.id && <Chip tone="accent">Seçili</Chip>}
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
                setChosen(null);
                setError(null);
              }}
              rows={9}
              lang="de"
              spellCheck={false}
              placeholder={EXAMPLE}
              className={`${FIELD} resize-y font-mono text-sm leading-relaxed`}
            />
            <p className="text-xs leading-relaxed text-pencil">
              Her satıra bir dize, başında LRC zamanı ([00:14.20]). Türkçesini kendin yazmak istersen <b>|</b> işaretinden sonra yaz; yazmazsan
              oynarken otomatik çevrilir.
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
        <p className={LABEL}>Ne çalsın?</p>
        <Segmented
          label="Oynatıcı"
          value={media}
          onChange={(m) => {
            setMedia(m);
            setError(null);
          }}
          options={[
            { value: "youtube", label: "YouTube" },
            { value: "spotify", label: "Spotify" },
            { value: "dosya", label: "Kendi dosyam" },
            { value: "yok", label: "Sesli okuma" },
          ]}
        />
        {media === "youtube" && (
          <p className="text-xs text-pencil">
            Video YouTube&apos;un kendi oynatıcısında açılır.{" "}
            {parsedLink?.kind !== "youtube" && (
              <>
                <a href={youtubeSearch} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-ink">
                  YouTube&apos;da ara
                </a>
                , linki kopyalayıp yukarıya yapıştır.{" "}
              </>
            )}
            Resmi ses ya da &quot;lyrics&quot; videoları sözlerle en iyi örtüşür.
          </p>
        )}
        {media === "spotify" && (
          <p className="text-xs text-pencil">
            Spotify&apos;ın kendi oynatıcısında çalar. Bu tarayıcıda Spotify&apos;a giriş yaptıysan şarkının tamamı, yoksa 30 saniyelik önizleme çalar.
          </p>
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
