"use client";

import Link from "next/link";
import { useState } from "react";
import { levelLabel } from "@/lib/curriculum";
import { dueIn } from "@/lib/stats";
import {
  removeSentence,
  removeWord,
  reviewWord,
  useAppState,
  useHydrated,
  WORD_INTERVALS_DAYS,
  type StarredWord,
} from "@/lib/store";
import { Icon } from "./icons";
import { Reels } from "./Reels";
import { Led } from "./SlotMachine";
import { Button, Card, Chip, LABEL, Segmented, SpeakButton, useNow } from "./ui";

function csvCell(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

function exportWords(words: StarredWord[]) {
  const rows = [
    ["Almanca", "Türkçe", "Örnek cümle (DE)", "Örnek cümle (TR)"],
    ...words.map((w) => [w.de, w.tr, w.contextDe, w.contextTr]),
  ];
  const csv = "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "almanca-kelimelerim.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** A word card in a small slot machine: the meaning spins in when revealed. */
function Flashcard({ word, remaining }: { word: StarredWord; remaining: number }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="space-y-4">
      <div className="machine sketch sketch-bold jitter p-2.5 sm:p-3">
        <span className="machine-shade" aria-hidden="true" />
        <div className="relative flex min-h-10 items-center gap-3 pr-2 pl-3">
          <span className="text-sm text-graphite">Kelime tekrarı</span>
          <Led label="Kalan" value={String(remaining)} className="ml-auto" />
        </div>
        <div className="reel-window sketch sketch-bold px-6 py-9 text-center sm:py-11">
          <span className="drum" aria-hidden="true" />
          <span className="payline" aria-hidden="true" />
          <p lang="de" className="hand-bold relative text-3xl sm:text-4xl">
            {word.de}
          </p>
          <p lang="tr" className="relative mt-3 font-note text-2xl font-bold text-red-pencil sm:text-3xl" style={{ lineHeight: 1.25 }}>
            {revealed ? <Reels text={word.tr} spinKey={`${word.id}:${word.due}`} /> : <span className="text-pencil">?</span>}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 text-sm text-graphite">
        <SpeakButton text={word.de} /> Sesli dinle
      </div>

      {revealed ? (
        <div className="animate-rise space-y-4">
          {word.contextDe && (
            <div className="sketch sketch-thin bg-sheet px-4 py-3 text-center text-sm">
              <p lang="de" className="flex items-center justify-center gap-1">
                {word.contextDe} <SpeakButton text={word.contextDe} />
              </p>
              <p className="mt-0.5 text-graphite">{word.contextTr}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="danger" size="lg" onClick={() => reviewWord(word.id, "again")}>
              Bilemedim
            </Button>
            <Button size="lg" onClick={() => reviewWord(word.id, "hard")}>
              Zorlandım
            </Button>
            <Button variant="primary" size="lg" onClick={() => reviewWord(word.id, "good")}>
              Bildim
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button variant="primary" size="lg" onClick={() => setRevealed(true)} autoFocus>
            Anlamını göster
          </Button>
        </div>
      )}
    </div>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-pencil transition-colors hover:bg-wash-red hover:text-red-pencil"
    >
      <Icon name="trash" />
    </button>
  );
}

export function NotebookView() {
  const state = useAppState();
  const hydrated = useHydrated();
  const now = useNow();
  const [tab, setTab] = useState<"words" | "sentences">("words");

  if (!hydrated) return <div className="sketch h-64 animate-pulse bg-ink/5" />;

  const dueWords = state.words.filter((w) => w.due <= now).sort((a, b) => a.due - b.due);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="hand-bold wobble-text scribble mr-auto inline-block text-4xl">Defterim</h1>
        <Segmented
          kind="tab"
          label="Defter bölümleri"
          value={tab}
          onChange={setTab}
          options={[
            { value: "words", label: `Kelimeler · ${state.words.length}` },
            { value: "sentences", label: `Cümleler · ${state.sentences.length}` },
          ]}
        />
      </div>

      {tab === "words" && (
        <>
          {state.words.length === 0 ? (
            <Card>
              <p className="hand-bold">Kelime defterin boş</p>
              <p className="mt-1 text-sm leading-relaxed text-graphite">
                Pratik yaparken ipucundaki ya da sonuçtaki kelimelerin yanındaki yıldıza bas. Burada aralıklı tekrarla çalışırsın:
                bildiğin kelimeler daha seyrek, bilmediklerin daha sık gelir.
              </p>
              <Link
                href="/"
                className="sketch jitter-hover hand-bold mt-4 inline-flex h-10 -rotate-[0.6deg] items-center gap-1.5 bg-marker px-4 text-sm text-ink hover:rotate-0"
              >
                Pratiğe başla <Icon name="arrowRight" />
              </Link>
            </Card>
          ) : dueWords.length > 0 ? (
            <Flashcard key={dueWords[0].id + dueWords[0].due} word={dueWords[0]} remaining={dueWords.length} />
          ) : (
            <Card className="flex items-center gap-3">
              <span className="sketch sketch-round inline-flex size-8 items-center justify-center bg-wash-green text-green-pencil [--line:var(--color-green-pencil)]">
                <Icon name="check" />
              </span>
              <p className="text-sm">Bugünlük tekrar edecek kelime kalmadı. Yarın yine bak.</p>
            </Card>
          )}

          {state.words.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className={LABEL}>Tüm kelimeler</h2>
                <Button size="sm" variant="ghost" onClick={() => exportWords(state.words)}>
                  <Icon name="download" /> CSV indir (Anki)
                </Button>
              </div>
              <ul className="sketch divide-y divide-dashed divide-ink/20 bg-sheet">
                {state.words.map((w) => (
                  <li key={w.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span lang="de" className="font-semibold">
                          {w.de}
                        </span>
                        <span className="text-graphite">{w.tr}</span>
                      </p>
                      {w.contextDe && (
                        <p lang="de" className="mt-0.5 truncate text-sm text-graphite">
                          {w.contextDe}
                        </p>
                      )}
                      <p className="mt-1.5 flex items-center gap-2 text-xs text-graphite">
                        <Chip tone={w.box >= 4 ? "success" : w.box >= 2 ? "warning" : "neutral"}>
                          Kutu {w.box}/{WORD_INTERVALS_DAYS.length - 1}
                        </Chip>
                        Tekrar: {dueIn(w.due, now)}
                      </p>
                    </div>
                    <SpeakButton text={w.de} />
                    <RemoveButton label={`${w.de} kelimesini sil`} onClick={() => removeWord(w.id)} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {tab === "sentences" &&
        (state.sentences.length === 0 ? (
          <Card>
            <p className="hand-bold">Yıldızlı cümlen yok</p>
            <p className="mt-1 text-sm text-graphite">
              Beğendiğin ya da zorlandığın cümleleri makinenin sağ üstündeki yıldızla buraya kaydedebilirsin.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {state.sentences.map((s) => (
              <li
                key={s.id}
                className="sketch sketch-thin flex items-start gap-3 bg-sheet px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm text-graphite">
                    <Chip tone="accent">{levelLabel(s.level)}</Chip>
                    <span className="min-w-0">{s.tr}</span>
                  </p>
                  <p lang="de" className="mt-1 text-lg font-medium">
                    {s.de}
                  </p>
                </div>
                <SpeakButton text={s.de} />
                <RemoveButton label="Cümleyi sil" onClick={() => removeSentence(s.id)} />
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
